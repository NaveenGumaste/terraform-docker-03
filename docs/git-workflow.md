# Task 4: Version-controlled DevOps project

## Objective

Practice a Git workflow for the Daymark Todo project, including branches, contextual commits, pull requests, ignore rules, and a release tag.

## Starting point

The repository and GitHub remote already existed. The starting branch was `main`, tracking `origin/main`. The remote is the public `NaveenGumaste/terraform-docker-03` repository.

The existing `.gitignore` was reviewed before staging. It excludes dependencies, environment files, Terraform provider cache, state files, and saved plans. Execution logs are intentionally retained as project evidence.

## Branch model

- `main`: stable project history and release tags.
- `dev`: integration branch for completed feature work.
- `feature/simple-todo-crud`: focused branch for simplifying the todo interface and keeping its create, read, update, and delete actions.

## Workflow

1. Create and publish the integration branch:

   ```sh
   git switch -c dev
   git push --set-upstream origin dev
   ```

2. Create a feature branch from `dev`:

   ```sh
   git switch -c feature/simple-todo-crud
   ```

3. Stage related files explicitly and create focused commits. The todo interface and its documentation are kept in separate commits.

4. Push the feature branch and open a pull request into `dev`. After review, merge it.

5. Open a second pull request from `dev` into `main`. Merge it to promote the integrated work.

6. Tag the release on `main`:

   ```sh
   git switch main
   git pull --ff-only origin main
   git tag -a v1.0.0 -m "Daymark Todo 1.0.0"
   git push origin v1.0.0
   ```

## Task deliverables

- GitHub repository with `main`, `dev`, and a feature branch.
- Feature and integration changes merged through pull requests.
- README with project setup and workflow notes.
- Existing ignore rules checked before staging.
- Contextual commits and a version tag.
