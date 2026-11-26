# Run the lab with Docker Compose

This is the original way to run this Labspace, on the [labspace-infra](https://github.com/dockersamples/labspace-infra) Compose stack. It works anywhere Docker/Podman and Docker/Podman Compose are installed.

## Run the published lab

You can run this Labspace in its latest version from any folder:

```bash
docker compose -f oci://scorespec/score-labspace:latest up
```

Then open the Labspace in your web browser: http://localhost:3030.

## Contribute to the lab

After you clone this repository, run the Labspace from your clone with these commands:

On Mac/Linux:

```bash
CONTENT_PATH=$PWD docker compose up --watch
```

On Windows with PowerShell:

```powershell
$Env:CONTENT_PATH = (Get-Location).Path; docker compose up --watch
```

Then open the Labspace in your web browser: http://localhost:3030.

The stack is defined by [compose.yaml](../compose.yaml), which includes the labspace-infra development stack, and [compose.override.yaml](../compose.override.yaml), which points it at this repository and installs the lab's tools in the workspace.

## Tear down the lab

When you are done, stop the Labspace and remove its containers, networks and volumes. Run the command that matches how you started it.

The published lab:

```bash
docker compose -f oci://scorespec/score-labspace:latest down --volumes
```

From your clone, on Mac/Linux:

```bash
CONTENT_PATH=$PWD docker compose down --volumes
```

From your clone, on Windows with PowerShell:

```powershell
$Env:CONTENT_PATH = (Get-Location).Path; docker compose down --volumes
```

The containers and the Kind cluster created during the lab run on your Docker engine: the lab's "Clean up" section removes them.

## How it is tested and published

Every pull request runs the [Test Labspace](../.github/workflows/test-labspace.yaml) workflow: it starts the Labspace and runs every `bash` code block of the lab in order, like a learner would. A `bash` block directly followed by a `none` block starting with `Error:` is expected to fail with that error message, and blocks with the `no-run-button` metadata are skipped. See [lab-to-script.py](../.github/scripts/lab-to-script.py) for the details.

[publish-labspace.yaml](../.github/workflows/publish-labspace.yaml) publishes the Labspace to `scorespec/score-labspace` on Docker Hub on every push to `main`, with the [publish-labspace-action](https://github.com/dockersamples/publish-labspace-action).
