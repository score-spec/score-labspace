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

```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Compose!"
```

```bash
docker compose up -d
```

## `--patch-templates`

```bash
score-compose init \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-compose/unprivileged.tpl
```

```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

```bash
docker compose up -d
```

## Resources

- [`score-compose` implementation](https://docs.score.dev/docs/score-implementation/score-compose/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-compose/patch-templates/)
