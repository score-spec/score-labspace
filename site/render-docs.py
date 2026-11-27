"""Render the run docs (docs/*.md) as pages of the GitHub Pages site.

    python site/render-docs.py docs _site

Each docs/<name>.md becomes <out>/<name>.html, in the landing page's look.
Links to other docs pages stay on the site (<name>.html); links to the rest of
the repository (../...) point to it on GitHub. The "Contribute to the lab" and
"How ... published" sections are left out, and so is anything between
<!-- github-only --> and <!-- /github-only -->.
"""

import html
import pathlib
import re
import sys

import markdown

REPO = "https://github.com/score-spec/score-labspace"

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="page page-doc">
    <a class="back" href="./"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>All the ways to run the lab</a>
    <article class="doc">
{body}
    </article>
    <footer class="footer">
      Source on <a href="{repo}/blob/main/docs/{name}.md">GitHub</a>
    </footer>
  </main>

  <script>
    document.querySelectorAll(".doc pre").forEach(function (pre) {{
      var btn = document.createElement("button");
      btn.className = "copy";
      btn.type = "button";
      btn.title = "Copy";
      btn.setAttribute("aria-label", "Copy the command");
      btn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">content_copy</span>';
      btn.addEventListener("click", function () {{
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(pre.querySelector("code").textContent.trim()).then(function () {{
          var icon = btn.firstElementChild;
          icon.textContent = "check";
          setTimeout(function () {{ icon.textContent = "content_copy"; }}, 1500);
        }}, function () {{}});
      }});
      pre.appendChild(btn);
    }});
  </script>
</body>
</html>
"""


def rewrite_link(match: re.Match) -> str:
    href = match.group(1)
    if href.startswith("../"):
        path = href[3:]
        kind = "tree" if path.endswith("/") or "." not in path.rsplit("/", 1)[-1] else "blob"
        href = f"{REPO}/{kind}/main/{path.rstrip('/')}"
    elif re.fullmatch(r"[\w-]+\.md(#.*)?", href):
        href = re.sub(r"\.md", ".html", href, count=1)
    return f'href="{href}"'


def render(src: pathlib.Path, out_dir: pathlib.Path) -> None:
    text = src.read_text(encoding="utf-8").replace("\r", "")
    title_match = re.search(r"^# (.+)$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else src.stem
    # The contributing and publishing sections are for maintainers: they stay on GitHub only.
    text = re.sub(
        r"^## (?:Contribute to the lab|How [^\n]*published)\b.*?(?=^## |\Z)",
        "",
        text,
        flags=re.MULTILINE | re.DOTALL,
    )
    # So is anything between <!-- github-only --> and <!-- /github-only -->.
    text = re.sub(r"<!-- github-only -->.*?<!-- /github-only -->\n?", "", text, flags=re.DOTALL)
    body = markdown.markdown(text, extensions=["extra", "toc"])
    body = re.sub(r'href="([^"]+)"', rewrite_link, body)
    # GitHub alerts (> [!NOTE]) become styled notes.
    body = re.sub(
        r"<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:</p>\s*<p>)?",
        lambda m: f'<blockquote class="alert"><p><strong>{m.group(1).title()}:</strong> ',
        body,
    )
    page = TEMPLATE.format(
        title=html.escape(f"{title} | Score Labspace"),
        body=body,
        repo=REPO,
        name=src.stem,
    )
    (out_dir / f"{src.stem}.html").write_text(page, encoding="utf-8")
    print(f"{src} -> {out_dir / (src.stem + '.html')}")


def main() -> None:
    docs_dir, out_dir = (pathlib.Path(p) for p in sys.argv[1:3])
    out_dir.mkdir(parents=True, exist_ok=True)
    for src in sorted(docs_dir.glob("*.md")):
        render(src, out_dir)


if __name__ == "__main__":
    main()
