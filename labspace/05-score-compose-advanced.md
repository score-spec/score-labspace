# More advanced scenario with `score-compose`

The `score-compose` implementation CLI provides more options to enrich the default `compose.yaml` file generated in order to support more native Docker Compose features.

## `--build`

Build the container image while deploying it via the `docker compose up --build` command, by using the `score-compose generate --build` feature:

```bash
score-compose generate score.yaml \
    --build 'hello-world={"context":".","tags":["hello-world"]}'
```

```bash
docker compose up --build -d
```

## `--override-property`

Override any properties of the Score file imperatively:
```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Compose!"
```

See the new `MESSAGE` value in the generated :fileLink[`compose.yaml`]{path="compose.yaml" line="17"} file.

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

In this example, this inlined snippet patches all the Workloads and sets the fields `read_only`, `user` and `cap_drop`.

_Note: instead of using the inlined format, you use `--patch-templates` with local or external files (Https, Git, OCI)._

```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the associated new fields and values in the generated :fileLink[`compose.yaml`]{path="compose.yaml" line="23"} file.

## Resources

- [`score-compose` CLI](https://docs.score.dev/docs/score-implementation/score-compose/cli/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-compose/patch-templates/)
- [Patch templates examples Hub](https://docs.score.dev/examples/patch-templates?implementation=score-compose)
