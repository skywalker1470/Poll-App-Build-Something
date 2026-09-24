FROM node:18-alpine
EXPOSE 3001
WORKDIR /app
COPY . .
RUN npm install
ENTRYPOINT ["npm", "start"]
