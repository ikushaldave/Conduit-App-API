# Conduit App API

This project is mostly inspired by a medium.com .

## Stack Used:

Backend Stack -

1. NodeJs
2. ExpressJs
3. MongoDB
4. NPM Modules (mongoose, jsonwebtoken, bcrypt etc..)

## Running API online:

[Live on Heroku](https://conduit-application-api.herokuapp.com/)

## Running API locally:

clone the following Repo

`git clone https://github.com/ikushaldave/Conduit-App-API.git`

after this, install node modules used in this project using commands

`npm install`

before running a server just replace value of `.env.sample` file with correct value and rename to `.env` file

& last the start the server running

`npm run start`

Browse To: `http://localhost:3000`

## Endpoints:

### Registration:

`POST /api/users`

Example request body:

```JSON
{
  "user":{
    "username": "ankurbansal",
    "email": "ankurbansal@gmail.com",
    "password": "Ankur@123"
  }
}
```

No authentication required, returns a [User](#users-authentication-required).

Required fields: `email`, `username`, `password` and username should minimum of length 6 & can contain '. - _', email should be valid & password should contain minimum of 8 at least one capital, at least one digit, and at least one special character

### Authentication:

`POST /api/users/login`

Example request body:

```JSON
{
  "user":{
    "email": "ankurbansal@gmail.com",
    "password": "Ankur@123"
  }
}
```

No authentication required, returns a [User](#users-authentication-required)

Required fields: `email`, `password`

### Get Current User

`GET /api/user`

Authentication required, returns a [User](#users-authentication-required) that's the current user

### Update User

`PUT /api/user`

Example request body:
```JSON
{
  "user":{
    "email": "jake@jake.jake",
    "bio": "I like to skateboard",
    "image": "https://i.stack.imgur.com/xHWG8.jpg"
  }
}
```

Authentication required, returns the [User](#users-authentication-required)

Accepted fields: `email`, `username`, `password`, `image`, `bio`

### Get Profile

`GET /api/profiles/:username`

Authentication optional, returns a [Profile](#profile)

### Follow user

`POST /api/profiles/:username/follow`

Authentication required, returns a [Profile](#profile)

No additional parameters required

### Unfollow user

`DELETE /api/profiles/:username/follow`

Authentication required, returns a [Profile](#profile)

No additional parameters required

### List Articles

`GET /api/articles`

Returns most recent articles globally by default, provide `tag`, `author` or `favorited` query parameter to filter results

Query Parameters:

Filter by tag:

`?tag=AngularJS`

Filter by author:

`?author=ankurbansal`

Favorited by user:

`?favorited=ankurbansal`

Limit number of articles (default is 20):

`?limit=20`

Offset/skip number of articles (default is 0):

`?offset=0`

Authentication optional, will return [multiple articles](#multiple-articles), ordered by most recent first

### Feed Articles

`GET /api/articles/feed`

Can also take `limit` and `offset` query parameters like [List Articles](#list-articles)

Authentication required, will return [multiple articles](#multiple-articles) created by followed users, ordered by most recent first.

### Get Article

`GET /api/articles/:slug`

No authentication required, will return [single article](#single-article)

### Create Article

`POST /api/articles`

Example request body:

```JSON
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "You have to believe",
    "tagList": ["reactjs", "angularjs", "dragons"]
  }
}
```

Authentication required, will return an [Article](#single-article)

Required fields: `title`, `description`, `body`

Optional fields: `tagList` as an array of Strings

### Update Article

`PUT /api/articles/:slug`

Example request body:

```JSON
{
  "article": {
    "title": "Did you train your dragon?"
  }
}
```

Authentication required, returns the updated [Article](#single-article)

Optional fields: `title`, `description`, `body`, `tagList`

The `slug` also gets updated when the `title` is changed

### Delete Article

`DELETE /api/articles/:slug`

Authentication required

### Add Comments to an Article

`POST /api/articles/:slug/comments`

Example request body:

```JSON
{
  "comment": {
    "body": "His name was my name too."
  }
}
```

Authentication required, returns the created [Comment](#single-comment)

Required field: `body`

### Get Comments from an Article

`GET /api/articles/:slug/comments`

Authentication optional, returns [multiple comments](#multiple-comments)

### Delete Comment

`DELETE /api/articles/:slug/comments/:id`

Authentication required

### Favorite Article

`POST /api/articles/:slug/favorite`

Authentication required, returns the [Article](#single-article)

No additional parameters required

### Unfavorite Article

`DELETE /api/articles/:slug/favorite`

Authentication required, returns the [Article](#single-article)

No additional parameters required

### Get Tags

`GET /api/tags`

No authentication required, returns a [List of Tags](#list-of-tags)

## JSON Objects returned by API:

`Content-Type: application/json; charset=utf-8` is returned in response.

### Users (authentication required)

```JSON
{
  "user": {
    "email": "ankurbansal@gmail.com",
    "token": "jwt.token.here",
    "username": "ankurbansal",
    "bio": "I work at null",
    "image": null
  }
}
```

### Profile

```JSON
{
  "profile": {
    "username": "ankurbansal",
    "bio": "I work at statefarm",
    "image": "https://static.productionready.io/images/smiley-cyrus.jpg",
    "following": false,
    "follower": false,
    "followings": "/api/profiles/ankurbansal/followings",
    "followers": "/api/profiles/ankurbansal/followers"
  }
}
```

### Single Article

```JSON
{
  "article": {
    "slug": "man-refusing-to-wear-mask-gets-covid-19-says-i-was-wrong-from-hospital-bed",
    "title": "Man refusing to wear mask gets COVID-19, says 'I was wrong' from hospital bed",
    "description": "Quisque velit nisi, pretium ut lacinia in, elementum id enim.",
    "body": "A 50-year-old US man who refused to wear a mask contracted COVID-19 and broke down in a video he shared from his hospital bed. 'I admit I was wrong...This has been brutal. I never knew that the human body could hurt so bad,' he said. 'I believed this was just a flu...I believed that COVID-19 was political,' the man said.",
    "tagList": [
      "covid-19",
      "technology",
      "business",
      "world"
    ],
    "createdAt": "2021-01-10T15:16:10.441Z",
    "updatedAt": "2021-01-10T15:16:10.441Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "sonukumar",
      "bio": null,
      "image": null,
      "following": false,
      "follower": false,
      "followings": "/api/profiles/sonukumar/followings",
      "followers": "/api/profiles/sonukumar/followers"
    }
  }
}
```

### Multiple Articles

```JSON
{
  "articles":[{
    "slug": "man-refusing-to-wear-mask-gets-covid-19-says-i-was-wrong-from-hospital-bed",
    "title": "Man refusing to wear mask gets COVID-19, says 'I was wrong' from hospital bed",
    "description": "Quisque velit nisi, pretium ut lacinia in, elementum id enim.",
    "body": "A 50-year-old US man who refused to wear a mask contracted COVID-19 and broke down in a video he shared from his hospital bed. 'I admit I was wrong...This has been brutal. I never knew that the human body could hurt so bad,' he said. 'I believed this was just a flu...I believed that COVID-19 was political,' the man said.",
    "tagList": [
      "covid-19",
      "technology",
      "business",
      "world"
    ],
    "createdAt": "2021-01-10T15:16:10.441Z",
    "updatedAt": "2021-01-10T15:16:10.441Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "sonukumar",
      "bio": null,
      "image": null,
      "following": false,
      "follower": false,
      "followings": "/api/profiles/sonukumar/followings",
      "followers": "/api/profiles/sonukumar/followers"
    }
  }],
  "articlesCount": 1
}
```

### Single Comment

```JSON
{
  "comment": {
    "id": "5ffb4843b9c9fb023aec0eea",
    "createdAt": "2021-01-10T18:32:35.677Z",
    "updatedAt": "2021-01-10T18:32:35.677Z",
    "body": "His name was my name too.",
    "author": {
        "username": "sonukumar",
        "bio": null,
        "image": null,
        "following": false,
        "follower": false,
        "followings": "/api/profiles/sonukumar/followings",
        "followers": "/api/profiles/sonukumar/followers"
    }
  }
}
```

### Multiple Comments

```JSON
{
  "comments": [{
    "id": "5ffb4843b9c9fb023aec0eea",
    "createdAt": "2021-01-10T18:32:35.677Z",
    "updatedAt": "2021-01-10T18:32:35.677Z",
    "body": "His name was my name too.",
    "author": {
        "username": "sonukumar",
        "bio": null,
        "image": null,
        "following": false,
        "follower": false,
        "followings": "/api/profiles/sonukumar/followings",
        "followers": "/api/profiles/sonukumar/followers"
    }
  }]
}
```

### List of Tags

```JSON
{
  "tags": [
    "reactjs",
    "angularjs"
  ]
}
```
### Errors and Status Codes

If a request fails any validations, expect a 422 and errors in the following format:

```JSON
{
  "errors": {
      "message": "bad request",
      "detail": "Article not found",
      "errorCode": "invalid-04"
  }
}
```

Note: `errorCode` is a custom error code provided to client side dev
#### Other status codes:

401 for Unauthorized requests, when a request requires authentication but it isn't provided

403 for Forbidden requests, when a request may be valid but the user doesn't have permissions to perform the action

404 for Not found requests, when a resource can't be found to fulfill the request
