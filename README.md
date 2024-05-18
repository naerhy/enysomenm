# enysomenm

Backend project for Mnemosyne, running on my VPS and for my personal use only.

## Description

...

## Usage

### Required environment variables

In order for the server to be properly launched, you have to create an .env file at the root of the project with the following information.

```
PORT=3000
JWT_SECRET=secret
UPLOADS_DIR=static
PASSWORD_ADMIN=hihihi
PASSWORD_USER=hahaha
SOURCES=Photographe,WhatsApp,Xialing,Patrick,Photobooth
SUBJECTS=Quentin,Magali,Anne.D,Camille
```

### Commands

```bash
# build the docker image
docker build . -t enysomenm

# start the container
docker run --name enysomenm -v /home/debian/static/mnemosyne:/enysomenm/static -p 3000:3000 --env-file .env enysomenm
```
