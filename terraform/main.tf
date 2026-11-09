terraform {
  required_version = ">= 1.1.5"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "4.6.0"
    }
  }
}

provider "docker" {}

data "docker_image" "daymark" {
  name = "daymark-todo:local"
}

resource "docker_container" "daymark" {
  name  = "terraform-task3-daymark"
  image = data.docker_image.daymark.id

  ports {
    internal = 3000
    external = 18080
  }
}
