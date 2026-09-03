# Getting started with `score-compose`

But from this `score.yaml` file we haven't deployed anything just yet.

Let's now deploy this workload locally with Docker Compose!

We'll use the `score-compose` implementation for that.

```bash
score-compose init
```

```bash
score-compose generate score.yaml \
    --image scorespec/sample-score-app:latest
```

A new `compose.yaml` file has been generated, see :fileLink[here]{path="compose.yaml"}.

All of this technical details abstracted by the `score-compose` implementation from the Developer.

We can now use Docker Compose to locally spin up our workload and its dependencies:
```bash
docker compose up -d
```

```bash
docker ps
```

Let's test the deployed workload on :tabLink[localhost:8080]{href="http://localhost:8080" title="App"}.

At this stage, the we used two resource types: `postgres`, `dns` and `route`.

The available resource types and their inputs/outputs could be discovered like this:
```bash
score-compose provisioners list
```

We'll explore more about these resource provisioners later.

## Resources

- [`score-compose` implementation](https://docs.score.dev/docs/score-implementation/score-compose/)