# Docker Getting Started

## Vorab

1. git clone von diesem Repo (`git clone git@github.com:tomschiffmann-teaching/03-draft-quiz-app.git`)
2. Den `.git` Ordner löschen und somit habt ihr eine frische Projektmappe, die nicht mehr mit meinem (Toms) repo verbunden

## Docker Images bauen

1. [./Dockerfile](./Dockerfile) muss vorhanden --> Dockerfile gibt an, wie das `image` gebuildet werden soll
2. `docker build -t tomteaching/quizz-app-web ./` (Wir bauen das image von dem Pfad aus, wo die Docker File, deswegen `./` weil wir uns hier in dem Verzeichnis befinden, wo das Dockerfile liegt)

- Allgemein: `docker build -t <docker-hub-username>/<app-name> <Verzeichnis-mit-Dockerfile>`

Beispiel:
![](./images/docker_desktop_image.png)

3. `docker run -p 3010:3000 tomteaching/quizz-app-web`

- Allgemein: `docker run -p <Host-Port>:<Docker-Port> <docker-hub-username>/<app-name>`
- `Host-Port`: Der Port auf eurem lokalen Betriebssystem (z.B. Windows, Mac, etc.)
- `Docker-Port` : Der Port auf dem eure App innerhalb von Docker läuft
- `<docker-hub-username>/<app-name>`: Der Image Name, welcher gestartet werden soll (siehe Screenshot oben als Beispiel)

## Docker Image auf Docker Hub deployen

1. Über `docker login` Benutzer mit Account authentifizieren
2. [https://hub.docker.com/repository/](https://hub.docker.com/repository/) aufrufen und neues Repository erstellen

- Nennt das repository zunächst erstmal genauso wie euer image (den Teil von `<app-name>`: Das was hinter dem slash steht von `<docker-hub-username>/<app-name>`)

3. `docker tag tomteaching/quizz-app-web tomteaching/quizz-app-web:latest`

- `docker tag <unser-lokales-image> <remote-image>:<version>`

4. `docker push tomteaching/quizz-app-web:latest`

- `docker push <remote-image>:<version>`

5. Unter [https://hub.docker.com/repository/](https://hub.docker.com/repository/) überprüfen ob die hochgeladene Version auch vorhanden
6. Über Docker Desktop alle Container löschen und auch alle Images löschen
7. Einmal überprüfen, dass app nicht mehr läuft
8. `docker pull tomteaching/quizz-app-web:latest`

- `docker pull <image>`

9. `docker run -p 3010:3000 tomteaching/quizz-app-web`

- `docker run -p <Host-Port>:<Docker-Port> <docker-hub-username>/<app-name>`
