# Daymark Todo

A simple vanilla JavaScript todo app served by Bun. Add, view, edit, complete, and delete tasks. Your list is saved in this browser with `localStorage`.

## Run locally

```bash
bun install
bun run start
```

Open <http://localhost:3000>. The `/health` route returns a small health response.

## Run with Docker

```bash
docker build -t daymark-todo .
docker run --rm -p 3000:3000 daymark-todo
```

Tasks stay in the browser profile where they were created; the server does not store task data.

## Frontend

The frontend UI was made using Codex with vanilla HTML, CSS, and JavaScript.

## Git workflow

Work on feature branches from `dev`, merge changes into `dev` with a pull request, and promote releases from `dev` to `main` with a pull request. See [the Git workflow guide](docs/git-workflow.md).

## Terraform Docker task

Terraform uses the Docker provider to manage a local container for this app. Build the image first so Terraform can find it on the local Docker host:

```powershell
docker build -t daymark-todo:local .
terraform -chdir=terraform init
terraform -chdir=terraform plan -out=tfplan-daymark
terraform -chdir=terraform apply tfplan-daymark
```

Open <http://localhost:18080>. The health route is <http://localhost:18080/health>.

Inspect Terraform state and remove the container when finished:

```powershell
terraform -chdir=terraform state list
terraform -chdir=terraform state show docker_container.daymark
terraform -chdir=terraform destroy
```

Execution logs are in `execution-logs/`. Terraform destroy removes the container; the locally built image remains on the Docker host.
