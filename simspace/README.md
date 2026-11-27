# Score Labspace, as a Simspace

An interactive, fully in-browser version of the [Score Labspace](../README.md), built on [Simspace](https://github.com/dockersamples/simspace). Instructions on the left, a simulated terminal on the right: every command and its output is scripted, so it runs the same for everyone, with nothing to install.

It's published at <https://score-spec.github.io/score-labspace/simspace/>. Use it to preview the real lab before you take it, to revisit it afterwards, or to teach it where nobody can run Docker or Kubernetes. The hands-on lab in [`labspace/`](../labspace) stays the reference; this folder is its translation.

## What's in the translation

One lab, [`labs/score/`](labs/score), with one section per page of the hands-on lab, from *Overview* to *Conclusion*. The hands-on sections have **milestones** (27 in total) that check off as the learner runs the right command in the right state.

### What differs from the real lab

- **The `score-compose` and `score-k8s` outputs are real, the others are modelled.** The outputs of their commands and the files they write (`compose.yaml`, `manifests.yaml`, the provisioners) come from real runs of `score-compose` 0.50.0 and `score-k8s` 0.23.0. The outputs of `docker`, `kind`, `kubectl` and `curl` follow the hands-on lab and are abridged.
- **The default provisioners files are abridged** to the provisioners of the resource types the lab uses (`postgres`, `dns` and `route`).
- **One command per line.** The Run buttons run each line on its own, so the multi-line commands of the hands-on lab are on one line.
- **Files instead of inline input.** The patch templates and the custom `dns` provisioner, piped inline (`-`) in the hands-on lab, are saved with **Save** buttons and passed as files.
- **No IDE.** The VS Code part of the *Score Spec* page is described instead of done, and `:filelink` links show the files in the terminal.
- **`curl` replaces the browser** to reach the application.

## Author locally

You only need Docker.

```bash
docker compose up dev                 # live preview at http://localhost:5173
docker compose run --rm validate      # validate the lab (fails on errors)
docker compose run --rm replay        # play the whole lab through the engine
```

- `validate` checks the structure: dangling references, commands that match no scenario, unknown milestones.
- `replay` ([`tools/replay.ts`](tools/replay.ts), adapted from [mathieu-benoit/dhi-launch](https://github.com/mathieu-benoit/dhi-launch/tree/main/simspace)) plays every runnable block in order, as the Run buttons would, and fails on blocks that dead-end, blocks that land on an error path (a scenario whose id ends in `-error`), and milestones that never complete. Run it after changing a scenario. Add `-v` for the full output, with `docker compose run --rm replay node scripts/run-ts.mjs scripts/replay.ts /labs/score -v`.

On Windows with Git Bash, prefix these commands with `MSYS_NO_PATHCONV=1`, so the `/labs` paths reach the container as they are.

Edit the files under `labs/score/` and refresh the browser:

- `labspace.yaml`: title, catalog card, the terminal, sections and milestones, and the seed files of the virtual filesystem (copied from [`../project`](../project)).
- `simulator.yaml`: what each command does, gated on a small state tree (the `state:` block at its top explains it).
- `*.md`: one file per section. The images are the hands-on lab's ([`../labspace/images`](../labspace/images)), mounted by `dev` and copied at deploy time.

`labs.json` is generated; never commit it.

The format is specified in [dockersamples/simspace](https://github.com/dockersamples/simspace): `spec/labspace.md` and `spec/simulator.md`.

## Deploy

The [`publish-pages`](../.github/workflows/publish-pages.yaml) workflow publishes this lab in `simspace/` on the repository's Pages site, next to the landing page ([`../site`](../site)), on every push to `main` that changes either. On pull requests it validates and replays the lab without deploying.

## Keeping it in sync

When the hands-on lab changes (a new step, a new flag, new outputs), update the matching section here: the markdown, the scenarios that produce the output, and the milestones (bump `version:` in `labspace.yaml` when you add, remove or rename one, so stored progress is reset). For the outputs and generated files of `score-compose` and `score-k8s`, run the same commands with the real CLIs and paste what they print and write. When `project/` changes, refresh the seed files in `labspace.yaml`. Then run `validate` and `replay`.
