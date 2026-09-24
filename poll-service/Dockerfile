FROM node:18-alpine
EXPOSE 3000
WORKDIR /app
COPY . .
RUN npm install
ENTRYPOINT ["npm", "start"]
