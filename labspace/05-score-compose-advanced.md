# Advanced scenario with `score-compose`

The `score-compose` implementation CLI provides more options to enrich the default `compose.yaml` file generated in order to support more native Docker Compose features.

_Note: when `--output` is not set, `score-compose generate` writes to `compose.yaml` by default._

## `--build`

Build the container image while deploying it via the `docker compose up --build` command, by using the `score-compose generate --build` feature:

```bash
score-compose generate score.yaml \
    --build 'hello-world={"context":".","tags":["hello-world"]}'
```

See the new `build` section of the `hello-world-hello-world` service in the generated :fileLink[`compose.yaml`]{path="compose.yaml" line="16"} file.

The base images in the :fileLink[`Dockerfile`]{path="Dockerfile"} come from the free [Docker Hardened Images](https://dhi.io) registry, authenticate to it with your Docker account (username and a personal access token):

```bash
docker login dhi.io
```

_Note: If you don't have a Docker account, you can skip the rest of this `--build` section._

Build and run the container image:

```bash
docker compose up --build -d
```

Test the workload, now running from the image you just built locally:
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors $(score-compose resources get-outputs dns.default#hello-world.dns --format '{{ .host }}:8080')
```

## `--override-property`

Override any properties of the Score file imperatively, without modifying the original `score.yaml` file owned by the Developer:
```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Compose!"
```

_Note: for bigger changes, you can also use `--overrides-file` with a partial Score file to merge in._

See the new `MESSAGE` value in the generated :fileLink[`compose.yaml`]{path="compose.yaml" line="13"} file.

Use Docker Compose to locally deploy the workload with its updated `MESSAGE`:
```bash
docker compose up -d
```

Test the deployed workload and see the updated line "`<h1>Hello, Compose!</h1>`":
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors $(score-compose resources get-outputs dns.default#hello-world.dns --format '{{ .host }}:8080')
```

## `--patch-templates`

Override the default content and any fields of the `compose.yaml` with the patch template feature:

```bash
echo '{{ range $name, $spec := .Workloads }}
{{ range $cname, $_ := $spec.containers }}
- op: set
  path: services.{{ $name }}-{{ $cname }}.read_only
  value: true
- op: set
  path: services.{{ $name }}-{{ $cname }}.user
  value: "65532"
- op: set
  path: services.{{ $name }}-{{ $cname }}.cap_drop
  value: ["ALL"]
{{ end }}
{{ end }}' | score-compose init --patch-templates -
```

In this example, this inlined snippet is a [Go template](https://pkg.go.dev/text/template) looping over all the Workloads and their containers, and setting the fields `read_only`, `user` and `cap_drop` of the associated Compose services.

The patch template is now stored in the `.score-compose` local state: it will be applied on every subsequent `score-compose generate`, for every Workload, without the Developer having to do anything. That's how Platform Engineers can enforce their standards.

```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the associated new fields and values in the generated :fileLink[`compose.yaml`]{path="compose.yaml" line="19"} file.

_Note: The `MESSAGE` is back to `Hello, World!` because we didn't pass `--override-property` this time, overrides are not persisted._

Deploy the patched workload:
```bash
docker compose up -d
```

Check that the running container is now unprivileged (user `65532`, read-only root filesystem and all capabilities dropped):
```bash
docker inspect project-hello-world-hello-world-1 \
    --format 'user={{ .Config.User }} read_only={{ .HostConfig.ReadonlyRootfs }} cap_drop={{ .HostConfig.CapDrop }}'
```

And the application still works:
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors $(score-compose resources get-outputs dns.default#hello-world.dns --format '{{ .host }}:8080')
```

Instead of using the inlined format, you can use `--patch-templates` with local or external files (Https, Git, OCI), like this:
```bash
score-compose init \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-compose/unprivileged.tpl
```

_Note: This [`unprivileged.tpl`](https://docs.score.dev/examples/patch-templates/score-compose/unprivileged/) community patch template is exactly the same as the inlined snippet you used above. Running `score-compose init --patch-templates` again replaces the patch templates stored in the local state._

## `--provisioners`

Resource provisioners are the way to define how Platform Engineers want to implement actual resource types defined in the Score file by the Developers.

In the example used so far, see this :fileLink[score.yaml]{path="score.yaml" line="17"} file, the resource types requested are `postgres`, `dns` and `route`.

The `score-compose init` command writes the default pre-defined resource types provisioners in the `.score-compose` local state.

See the list of available resource types:
```bash
score-compose provisioners list -f json | jq -r .[].Type
```

See the actual definitions of these resource provisioners here: :fileLink[zz-default.provisioners.yaml]{path=".score-compose/zz-default.provisioners.yaml"}.

You can use these default pre-defined resource types provisioners or you may want to bring your own definitions more specialized for your context and own needs.

To experiment with this, we will reset the local state. But first, remove the containers currently running: the `.score-compose` directory holds the identity of the provisioned resources (generated names, passwords, ...), deleting it means brand new resources will be generated.
```bash
docker compose down --volumes
```

You can skip the default provisioners by using the `--no-default-provisioners` option:
```bash
rm -rf .score-compose
score-compose init --no-default-provisioners
```

From this, if you try to generate the `compose.yaml` file from the `score.yaml` file, you will get the errors mentioning that the resource types don't have any resource provisioners defined:
```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

```none
Error: failed to provision: resource 'dns.default#hello-world.dns' is not supported by any provisioner
```

Bring your own `dns` resource provisioner:
```bash
score-compose init --no-default-provisioners --provisioners=- <<EOF
- uri: template://custom-dns
  type: dns
  description: Outputs a localhost domain as the hostname.
  outputs: |
    host: localhost
  expected_outputs:
    - host
EOF
```

Regenerate the `compose.yaml` file accordingly and see that the `dns` provisioner error is gone, the next error will be about `postgres`:
```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

```none
Error: failed to provision: resource 'postgres.default#hello-world.db' is not supported by any provisioner
```

Validate the resource types supported at this stage:
```bash
score-compose provisioners list
```

Bring back the default resource provisioners to fix the `postgres` and `route` resource types errors as well as bringing our own `dns` resource provisioner to override the default one:
```bash
rm -rf .score-compose
score-compose init --provisioners=- <<EOF
- uri: template://custom-dns
  type: dns
  description: Outputs a localhost domain as the hostname.
  outputs: |
    host: localhost
  expected_outputs:
    - host
EOF
```

Validate the resource types supported now:
```bash
score-compose provisioners list
```

Notice that there are now two `dns` provisioners. The provisioner files in the `.score-compose` directory are loaded in alphabetical order and the first provisioner matching a resource type wins. That's why the default provisioners file is named `zz-default.provisioners.yaml`: your own provisioners always take precedence over the default ones.

Regenerate the `compose.yaml` file accordingly and see that we don't have any error anymore:
```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the actual `outputs` generated by the associated resource types used:
```bash
score-compose resources list 
```

```none
+---------------------------------+------------------------------------------------+
|               UID               |                    OUTPUTS                     |
+---------------------------------+------------------------------------------------+
| dns.default#hello-world.dns     | host                                           |
+---------------------------------+------------------------------------------------+
| postgres.default#hello-world.db | database, host, name, password, port, username |
+---------------------------------+------------------------------------------------+
| route.default#hello-world.route |                                                |
+---------------------------------+------------------------------------------------+
```

Deploy the workload with its new resources:
```bash
docker compose up -d
```

Test the deployed workload, this time with the plain `localhost` hostname coming from your own `dns` provisioner:
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors localhost:8080
```

_Note: The Developer's `score.yaml` file didn't change at all, only the platform side (the provisioners) did._

## Resources

- [`score-compose` CLI](https://docs.score.dev/docs/score-implementation/score-compose/cli/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-compose/patch-templates/)
- [Patch templates examples Hub](https://docs.score.dev/examples/patch-templates?implementation=score-compose)
- [Resource provisioners](https://docs.score.dev/docs/score-implementation/score-compose/resources-provisioners/)
- [Resource provisioners examples Hub](https://docs.score.dev/examples/resource-provisioners?implementation=score-compose)
