FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node api ./api
EXPOSE 3000
USER node
CMD ["node", "server.js"]
