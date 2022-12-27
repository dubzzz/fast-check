FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:18

# Inspired from https://github.com/microsoft/vscode-dev-containers/blob/main/containers/codespaces-linux/.devcontainer/base.Dockerfile

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG HOMEDIR=/home/$USERNAME
ENV NVS_HOME="/home/${USERNAME}/.nvs"

RUN mkdir -p ${NVS_HOME}
RUN chown -R ${USERNAME}: ${NVS_HOME}
RUN sudo -u ${USERNAME} git clone -c advice.detachedHead=false --depth 1 -b v1.7.0 https://github.com/jasongin/nvs ${NVS_HOME}
RUN sudo -u ${USERNAME} bash ${NVS_HOME}/nvs.sh install
RUN rm ${NVS_HOME}/cache/*
RUN rm -rf ${NVS_HOME}/.git

USER ${USERNAME}