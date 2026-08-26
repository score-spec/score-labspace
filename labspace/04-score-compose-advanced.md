# More advanced with `score-compose`

## Override properties

```bash
score-compose generate score.yaml \
    --build 'hello-world={"context":".","tags":["hello-world"]}' \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Compose!"
```

```bash
docker compose up --build -d
```

## Patch templates

```bash
score-compose init \
    --no-sample \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-compose/unprivileged.tpl
```

```bash
score-compose generate score.yaml \
    --build 'hello-world={"context":".","tags":["hello-world"]}' \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Compose!"
```

```bash
docker compose up --build -d
```