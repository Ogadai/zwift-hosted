FROM node

COPY . .
CMD [ "npm", "install" ]

EXPOSE 8080
