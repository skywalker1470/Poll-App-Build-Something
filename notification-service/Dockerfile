FROM node:18-alpine
EXPOSE 3003
WORKDIR /app
COPY . .
RUN npm install
ENTRYPOINT ["npm", "start"]
