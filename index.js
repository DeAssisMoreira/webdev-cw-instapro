import { addPost, getPosts } from './api.js'
import { renderAddPostPageComponent } from './components/add-post-page-component.js'
import { renderAuthPageComponent } from './components/auth-page-component.js'
import {
    ADD_POSTS_PAGE,
    AUTH_PAGE,
    LOADING_PAGE,
    POSTS_PAGE,
    USER_POSTS_PAGE,
} from './routes.js'
import { renderPostsPageComponent } from './components/posts-page-component.js'
import { renderLoadingPageComponent } from './components/loading-page-component.js'
import {
    getUserFromLocalStorage,
    removeUserFromLocalStorage,
    saveUserToLocalStorage,
} from './helpers.js'
import { renderUserPostsPageComponent } from './components/user-page-component.js'

export let user = getUserFromLocalStorage()
export let page = null
export let posts = []

const getToken = () => {
    const token = user ? `Bearer ${user.token}` : undefined
    return token
}

export const logout = () => {
    user = null
    removeUserFromLocalStorage()
    goToPage(POSTS_PAGE)
}

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
    if (
        [
            POSTS_PAGE,
            AUTH_PAGE,
            ADD_POSTS_PAGE,
            USER_POSTS_PAGE,
            LOADING_PAGE,
        ].includes(newPage)
    ) {
        if (newPage === ADD_POSTS_PAGE) {
            /* Если пользователь не авторизован, то отправляем его на страницу авторизации перед добавлением поста */
            page = user ? ADD_POSTS_PAGE : AUTH_PAGE
            return renderApp()
        }

        if (newPage === POSTS_PAGE) {
            page = LOADING_PAGE
            renderApp()

            return getPosts({ token: getToken() })
                .then((newPosts) => {
                    console.log('Загруженные посты', newPosts)
                    page = POSTS_PAGE
                    posts = newPosts
                    renderApp()
                })
                .catch((error) => {
                    console.error(error)
                    goToPage(POSTS_PAGE)
                })
        }

        if (newPage === USER_POSTS_PAGE) {
            page = LOADING_PAGE
            renderApp()

            return fetch(`${postsHost}/user-posts/${data.userId}`, {
                method: 'GET',
                headers: {
                    Authorization: getToken(),
                },
            })
                .then((response) => response.json())
                .then((newPosts) => {
                    page = USER_POSTS_PAGE
                    posts = newPosts.posts
                    renderApp()
                })
                .catch((error) => {
                    console.error('Ошибка загрузки постов пользователя:', error)
                    goToPage(POSTS_PAGE)
                })
        }

        page = newPage
        renderApp(renderUserPostsPageComponent)

        return
    }

    throw new Error('страницы не существует')
}

const renderApp = () => {
    const appEl = document.getElementById('app')
    if (page === LOADING_PAGE) {
        return renderLoadingPageComponent({
            appEl,
            user,
            goToPage,
        })
    }

    if (page === AUTH_PAGE) {
        return renderAuthPageComponent({
            appEl,
            setUser: (newUser) => {
                user = newUser
                saveUserToLocalStorage(user)
                goToPage(POSTS_PAGE)
            },
            user,
            goToPage,
        })
    }

    if (page === ADD_POSTS_PAGE) {
        return renderAddPostPageComponent({
            appEl,
            onAddPostClick({ description, imageUrl }) {
                page = LOADING_PAGE
                renderApp()

                return addPost({
                    token: getToken(),
                    description,
                    imageUrl,
                }).then(() => {
                    return getPosts({ token: getToken() })
                        .then((newPosts) => {
                            posts = newPosts
                            goToPage(POSTS_PAGE)
                        })
                        .catch((error) => {
                            console.error('Ошибка добавления поста:', error)
                            goToPage(ADD_POSTS_PAGE)
                            throw Error
                        })
                })
            },
            //  console.log("Добавляю пост...", { description, imageUrl })
        })
    }

    if (page === POSTS_PAGE) {
        return renderPostsPageComponent({
            appEl,
            user,
        })
    }

    // @TODO: реализовать страницу с фотографиями отдельного пользвателя
    if (page === USER_POSTS_PAGE) {
        return renderUserPostsPageComponent({
            appEl,
            user,
            posts,
            page,
        })
    }
}

goToPage(POSTS_PAGE, USER_POSTS_PAGE)
