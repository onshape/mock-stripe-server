FROM node:carbon-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --production && yarn global add forever

COPY . .

EXPOSE 5757
CMD [ "npm", "start" ]
