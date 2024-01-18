FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN apt update
COPY . .
CMD [ "node", "--watch", "index.js" ]