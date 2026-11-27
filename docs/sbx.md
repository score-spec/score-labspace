# Run the lab in a Docker Sandbox

You can run this lab with [`sbx`](https://docs.docker.com/ai/sandboxes/) instead of Docker Compose. Everything (instructions, VS Code, and a private Docker engine for the lab, the Kind cluster included) runs in a single microVM, and `sbx rm` removes everything the lab created.

> [!NOTE]
> No AI agent is involved, even though this runs in Docker Sandboxes: the lab uses the plain `shell` sandbox, and you type every command yourself.

## The kits

This option uses [Sandbox Kits](https://github.com/docker/sandbox-kit-spec), layered onto the `shell` sandbox:

- the **Labspace kit** from [mathieu-benoit/labsbxes](https://github.com/mathieu-benoit/labsbxes), which runs the interface and the IDE;
- the **content kit** of this repository (in [sbx-kit/](../sbx-kit)), which carries `labspace/`, the sample app, the lab's tools (`score-compose`, `score-k8s`, `kind`, `kubectl` and `helm`), the port of the app deployed with `score-compose` (`8080`) and the network access the lab needs. It requires the Labspace kit: `sbx` refuses to start it without it.

They are also published together as one reference: the **kit set** [score-labsbx.yaml](../score-labsbx.yaml) merges the two with the `shell` sandbox into a single workload kit, `ghcr.io/score-spec/score-labsbx` (see [Kit sets](https://docs.docker.com/ai/sandboxes/customize/author/kit-sets/)).

## Before you start

By default `sbx` only installs kits from `docker.io/` and `dhi.io/`, so first allow the GHCR namespaces of the kits:

```bash
sbx settings set kit.allowedSources '["docker.io/","dhi.io/","ghcr.io/mathieu-benoit/","ghcr.io/score-spec/"]'
```

## Run the lab

From an empty folder (`sbx run` mounts the current folder as the workspace), run the kit set:

```bash
sbx run ghcr.io/score-spec/score-labsbx:latest -p 3030:3030 -p 8085:8085 -p 8080:8080 --name score-lab -d
```

This is the same as passing the two kits yourself onto `shell`:

```bash
sbx run shell --kit ghcr.io/mathieu-benoit/labsbxes/labspace:latest --kit ghcr.io/score-spec/score-labsbx-mixin:latest -p 3030:3030 -p 8085:8085 -p 8080:8080 --name score-lab -d
```

The set pins the exact version of each kit it was built with, including `shell`, so it changes only when it is republished; passing the two `:latest` kits onto `shell` picks up each one's newest version.

Then open the Labspace in your web browser: http://localhost:3030.

- `-p 3030:3030` pins the Labspace's address: without it, `sbx` picks a random host port, that `sbx port ls score-lab` lists for the sandbox port `3030`.
- `-p 8085:8085` is required: the Labspace embeds the IDE at `http://localhost:8085`.
- `-p 8080:8080` lets you open the workload deployed with `score-compose` (`http://<dns>.localhost:8080`) from your own web browser.
- Stop the lab with `sbx stop score-lab`, restart it with `sbx run --name score-lab -d`.

## Contribute to the lab

From a clone of this repository, you can run the local version of the content kit instead of the published one:

```bash
sbx run shell --kit ghcr.io/mathieu-benoit/labsbxes/labspace:latest --kit ./sbx-kit -p 3030:3030 -p 8085:8085 -p 8080:8080 --name score-lab -d
```

`sbx` builds `./sbx-kit` on its own, so that local kit carries the lab's tools but not its instructions: the Labspace kit serves the clone's own `labspace/`, and the IDE opens the clone's `project/` folder, into which the kit copies the sample app at the first start (it is ignored by Git, see [.gitignore](../.gitignore)). Run it from the clone, not from an empty folder. Add `--kit-arg devMode=true` to see markdown edits live.

## Tear down the lab

When you are done, delete the sandbox:

```bash
sbx rm score-lab
```

This removes everything the lab created: the containers, images, volumes, networks and Kind cluster of the sandbox's private Docker engine, and your changes to the lab's project. When you ran from a clone with `./sbx-kit`, the sample app and your edits to it are in the clone's `project/` folder and stay there.

## How it works

A few things differ from the Compose setup, and the content kit takes care of them:

- The sandbox VM has no `/dev/kmsg`, without which the kubelet of the Kind node doesn't start: a startup hook creates it.
- The sandbox's network proxy intercepts the TLS connections to Docker Hub with its own CA, which the Kind nodes don't trust: the kit's `kind` wrapper adds that CA to the nodes after `kind create cluster`.
- The sandbox only reaches the hosts its network policy allows: the content kit allows the ones the lab uses (`mirror.gcr.io`, GitHub, `ghcr.io`, `dhi.io`).

## How the kits are published

Both kits are published by [.github/workflows/publish-kit.yaml](../.github/workflows/publish-kit.yaml) on every push to `main`: first the content kit, `ghcr.io/score-spec/score-labsbx-mixin`, then the kit set, `ghcr.io/score-spec/score-labsbx`, so the set always includes the content kit just published (and the newest `shell` and Labspace kits).

- For each, `:latest` and `:sha-<short>` follow `main`, and `:<version>` (from `version:` in [sbx-kit/score-labsbx-mixin.yaml](../sbx-kit/score-labsbx-mixin.yaml) and [score-labsbx.yaml](../score-labsbx.yaml)) is published the first time that version reaches `main` and never overwritten, so bump `version:` to release a new one.
- The content kit is built from the repository root (`docker buildx build . -f sbx-kit/score-labsbx-mixin.yaml`), which is how the published kit carries `labspace/`.
- Pull requests only build and validate the content kit, with [kit-tck](https://github.com/docker/sandbox-kit-spec).
- The content kit always installs the latest `score-compose`, `score-k8s`, `kind`, `kubectl` and `helm` releases, at the time it is built.
- New GHCR packages can start out private: make the packages public after the first publish.
