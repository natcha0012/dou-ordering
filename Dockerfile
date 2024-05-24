from node:alpine as development

RUN npm install -g @nestjs/cli

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm install

COPY . .
RUN npm run generate
RUN npm run build

from node:alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --prod

COPY --from=development /app/dist ./dist

CMD ["node", "dist/main"]