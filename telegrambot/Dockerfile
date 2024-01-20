FROM node:18
WORKDIR /app
COPY . .
RUN npm install
COPY . .
CMD [ "node", "--watch", "index.js" ]