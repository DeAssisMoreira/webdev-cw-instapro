// Замени на свой, чтобы получить независимый от других набор данных.
// "боевая" версия инстапро лежит в ключе prod
const personalKey = 'vladislav'
const baseHost = 'https://webdev-hw-api.vercel.app'
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`

export function getPosts({ token }) {
    return fetch(postsHost, {
        method: 'GET',
        headers: {
            Authorization: token,
        },
    })
        .then((response) => {
            if (response.status === 401) {
                throw new Error('Нет авторизации')
            }

            return response.json()
        })
        .then((data) => {
            return data.posts
        })
}

export function registerUser({ login, password, name, imageUrl }) {
    return fetch(baseHost + '/api/user', {
        method: 'POST',
        body: JSON.stringify({
            login,
            password,
            name,
            imageUrl,
        }),
    }).then((response) => {
        if (response.status === 400) {
            throw new Error('Такой пользователь уже существует')
        }
        return response.json()
    })
}

export function loginUser({ login, password }) {
    return fetch(baseHost + '/api/user/login', {
        method: 'POST',
        body: JSON.stringify({
            login,
            password,
        }),
    }).then((response) => {
        if (response.status === 400) {
            throw new Error('Неверный логин или пароль')
        }
        return response.json()
    })
}

// Загружает картинку в облако, возвращает url загруженной картинки
export function uploadImage({ file }) {
    const data = new FormData()
    data.append('file', file)

    return fetch(baseHost + '/api/upload/image', {
        method: 'POST',
        body: data,
    }).then((response) => {
        return response.json()
    })
}
export function addPost({ token, description, imageUrl }) {
    return fetch(postsHost, {
        method: 'POST',
        headers: {
            Authorization: token,
        },
        body: JSON.stringify({
            description,
            imageUrl,
        }),
    }).then((response) => {
        if (response.status === 401) {
            throw new Error('Нет авторизации')
        }
        if (!response.ok) {
            throw new Error('Ошибка при публикации поста')
        }
        return response.json()
    })
}

export function getUserPosts({token, userId}) {
    console.log(userId);
     return fetch(`${postsHost}/user-posts/${userId}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })
    .then((response) => {
        if (response.status === 404) {
            throw new Error('user not found')
        }
        return response.json()
    })
      .then((data) => {
        console.log(data);
        return data.posts || [];
      })
}

// export function renderUserPostsPageComponent({ token, appEl, user, posts, page }) {
//   return fetch(`${postsHost}/user-posts/${data.userId}`, {
//       method: "GET",
//       headers: {
//         Authorization: getToken(),
//       },
//     })
//       .then((response) => response.json())
//       .then((newPosts) => {
//         page = USER_POSTS_PAGE;
//         posts = newPosts.posts;
//         renderApp();
//       })
//       .catch((error) => {
//         console.error("Ошибка загрузки постов пользователя:", error);
//         goToPage(POSTS_PAGE);
//       });
//   };
