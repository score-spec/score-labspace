👋 Welcome to the **Score Labspace**!

This is a learning experience for exploring and understanding the CNCF Sandbox project [Score](https://www.cncf.io/projects/score/) and its features.

You will be guided through instructions to run command lines with tools already pre-installed to better understand the concepts of Score and its features.

✅ Here is how this lab is structured:

- Introduction to Score
- The Score Specification
- Getting started with `score-compose`
- Getting started with `score-k8s`
- Advanced scenario with `score-compose`
- Advanced scenario with `score-k8s`
- Next steps

## Run this Labspace

**👉 [Open the lab's site](https://score-spec.github.io/score-labspace/)** to pick how to run it:

- **[In a Docker Sandbox](https://score-spec.github.io/score-labspace/sbx.html)** (recommended): the Labspace in a single microVM with `sbx`, with its own Docker engine for everything the lab creates.
- **[With Docker Compose](https://score-spec.github.io/score-labspace/compose.html)**: the Labspace on the labspace-infra Compose stack, anywhere Docker/Podman and Docker/Podman Compose are installed.
- **[Simulated, in your browser](https://score-spec.github.io/score-labspace/simspace/)**: a [Simspace](https://github.com/dockersamples/simspace) with a scripted terminal, nothing to install.

## Contribute to this Labspace

To contribute to the content of this Labspace, it's easy, it's just about `.md` files under the `/labspace` folder or feel free to file any issues [there](https://github.com/score-spec/score-labspace/issues), thanks, much appreciated!

[docs/sbx.md](docs/sbx.md) and [docs/compose.md](docs/compose.md) also cover running the lab from a clone of this repository, and how it is tested and published. The Simspace's source is in [simspace/](simspace) (see its [README](simspace/README.md)), and the site's in [site/](site).
