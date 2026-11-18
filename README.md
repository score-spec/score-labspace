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

You can run this Labspace in its latest version from anywhere (if you have Docker/Podman and Docker/Podman Compose installed):

```bash
docker compose -f oci://scorespec/score-labspace:latest up
```

_To clean it up when needed, you can run this command:_
```bash
docker compose -f oci://scorespec/score-labspace:latest down --volumes
```

And then open the labspace in your web browser: http://localhost:3030.

## Run this Labspace in a Docker Sandbox

You can also run this Labspace in a [Docker Sandbox](https://docs.docker.com/ai/sandboxes/) (`sbx`), a microVM with its own Docker engine, by using the Labspace kit from [labsbxes](https://github.com/mathieu-benoit/labsbxes). This repository is a content kit for it: [score-labspace.yaml](score-labspace.yaml) and [score-labspace.dockerfile](score-labspace.dockerfile) carry the instructions, the sample app and the tools of the lab (`score-compose`, `score-k8s`, `kind`, `kubectl` and `helm`).

Allow the kits from `ghcr.io/mathieu-benoit/` (by default, `sbx` only installs kits from `docker.io/` and `dhi.io/`):

```bash
sbx settings set kit.allowedSources '["docker.io/","dhi.io/","ghcr.io/mathieu-benoit/"]'
```

Clone this repository, then run the Labspace from an empty folder next to it (a folder with a `labspace/labspace.yaml` file, like this repository, would be used as the lab content instead of the kit):

```bash
git clone https://github.com/score-spec/score-labspace
mkdir score-lab && cd score-lab
sbx run shell \
  --kit ghcr.io/mathieu-benoit/labsbxes/labspace:0.1.3 \
  --kit ../score-labspace \
  -p 3030:3030 -p 8085:8085 -p 8080:8080 \
  --name score-lab -d
```

And then open the labspace in your web browser: http://localhost:3030.

- `-p 3030:3030` pins the labspace's address, without it `sbx` picks a random host port: `sbx port ls score-lab` lists it.
- `-p 8085:8085` is required: the labspace embeds the IDE at http://localhost:8085.
- `-p 8080:8080` is optional: it lets you open the workload deployed with `score-compose` from your own web browser.
- Everything the lab creates (containers, the Kind cluster) runs on the sandbox's own Docker engine, not on yours.

_To clean it up when needed, you can run this command:_
```bash
sbx rm score-lab
```

## Contribute to this Labspace

After you cloned this GitHub repository, you can run this Labspace locally by running these commands:

On Mac/Linux:

```bash
CONTENT_PATH=$PWD docker compose up --watch
```

_To clean it up when needed, you can run this command:_
```bash
CONTENT_PATH=$PWD docker compose down --volumes
```

On Windows with PowerShell:

```bash
$Env:CONTENT_PATH = (Get-Location).Path; docker compose up --watch
```

_To clean it up when needed, you can run this command:_
```bash
$Env:CONTENT_PATH = (Get-Location).Path; docker compose down --volumes
```

Then open the labspace in your web browser: http://localhost:3030.

Every pull request runs the [Test Labspace](.github/workflows/test-labspace.yaml) workflow: it starts the Labspace and runs every `bash` code block of the lab in order, like a learner would. A `bash` block directly followed by a `none` block starting with `Error:` is expected to fail with that error message, and blocks with the `no-run-button` metadata are skipped. See [lab-to-script.py](.github/scripts/lab-to-script.py) for the details.

To contribute to the content of this Labspace, it's easy, it's just about `.md` files under the `/labspace` folder or feel free to file any issues [there](https://github.com/score-spec/score-labspace/issues), thanks, much appreciated!
