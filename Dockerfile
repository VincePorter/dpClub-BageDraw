FROM node
WORKDIR /app
COPY package.json .

ARG NODE_ENV
RUN npm install --omit-dev;

COPY . ./
ENV PORT 3110
EXPOSE $PORT
CMD ["node","app.js"]