import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { goToPage } from '../index.js'
import { formatDistanceToNow } from ' https://cdn.jsdelivr.net/npm/date-fns@3/+esm'
import * as ruLocale from ' https://cdn.jsdelivr.net/npm/date-fns@3/locale/ru/+esm'
import { likePost, dislikePost, getUserPosts, deletePost } from '../api.js'
import { escapeHtml } from '../helpers.js'

export function renderUserPostsPageComponent({ appEl, user, posts, page }) {
    const isUserPostsPage = page === USER_POSTS_PAGE
    const currentUser =
        isUserPostsPage && posts.length > 0 ? posts[0].user : null

    const isCurrentUserPost = (post, currentUser) => {
        if (!currentUser || !post) return false
        const ownerId = post?.user?.id ?? post?.userId ?? post?.user?._id
        const currentUserId = currentUser?.id ?? currentUser?._id ?? currentUser?.user?.id
        return currentUserId != null && String(ownerId) === String(currentUserId)
    }
    posts = posts.map((post) => ({
        ...post,
        likes: post.likes || [],
        isLiked: user
            ? (post.likes || []).some(
                  (like) =>
                      like?.userId === user.id ||
                      like?.id === user.id ||
                      like?.user?.id === user.id,
              )
            : false,
    }))

    const appHtml = `
        <div class="page-container">
            <div class="header-container"></div>
            ${
                currentUser
                    ? `
                <div class="posts-user-header">
                    <img src="${currentUser.imageUrl}" class="posts-user-header__user-image">
                    <p class="posts-user-header__user-name">${escapeHtml(currentUser.name)}</p>
                </div>
            `
                    : ''
            }
            <ul class="posts">
                ${posts
                    .map(
                        (post) => {
                            const ownerId = post?.user?.id ?? post?.userId ?? post?.user?._id
                            const isOwn = isCurrentUserPost(post, user)
                            return `
                    <li class="post" data-owner-id="${ownerId ?? ''}" data-is-own="${isOwn}">
                        <div class="post-header" data-user-id="${post.user.id}">
                            <img src="${post.user.imageUrl}" class="post-header__user-image">
                            <p class="post-header__user-name">${escapeHtml(post.user.name)}</p>
                        </div>
                        <div class="post-image-container">
                            <img class="post-image" src="${post.imageUrl}">
                        </div>
                        <div class="post-likes">
                            <button data-post-id="${post.id}" class="like-button">
                                <img src="./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}"> 
                            </button>
                            <p class="post-likes-text">
                                Нравится: <strong>${post.likes.length}</strong>
                            </p>
                            ${isCurrentUserPost(post, user) ? `
                              <button class="delete-button" data-post-id="${post.id}">Удалить</button>
                            ` : ''}
                        </div>
                        <p class="post-text">
                            <span class="user-name">${escapeHtml(post.user.name)}</span>
                            ${post.description}
                        </p>
                        <p class="post-date">
                            ${formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: ruLocale.default,
                            })}
                        </p>
                    </li>
                `
                        }
                    )
                    .join('')}
            </ul>
        </div>
    `

    appEl.innerHTML = appHtml

    // Диагностика
    try {
        const currentUserId = user?.id ?? user?._id ?? user?.user?.id
        const deleteButtonsCount = document.querySelectorAll('.delete-button').length
        console.log('[user-posts] currentUserId=', currentUserId, 'deleteButtons=', deleteButtonsCount)
    } catch {}

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })

    setupLikeHandlers({
        posts,
        token: user ? `Bearer ${user.token}` : null,
        userId: user?.id,
    })

    setupDeleteHandlers({ user, isUserPostsPage })
}

function setupLikeHandlers({ posts, token, userId }) {
    const likeButtons = document.querySelectorAll('.like-button')

    likeButtons.forEach((likeButton) => {
        likeButton.addEventListener('click', async (event) => {
            event.stopPropagation()
            const postId = likeButton.dataset.postId

            if (!token) {
                alert('Для выполнения этого действия необходимо авторизоваться')
                return
            }

            if (likeButton.dataset.loading === 'true') return
            likeButton.dataset.loading = 'true'

            const post = posts.find((post) => String(post.id) === String(postId))
            if (!post) return

            try {
                const likeImg = likeButton.querySelector('img')
                const likesText = likeButton.nextElementSibling

                const wasLiked = post.isLiked
                const prevCount = post.likes.length
                
                post.isLiked = !post.isLiked
                likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`
                const optimisticCount = prevCount + (post.isLiked ? 1 : -1)
                likesText.innerHTML = `Нравится: <strong>${optimisticCount}</strong>`

                if (wasLiked) {
                    await dislikePost({ token, postId })
                } else {
                    await likePost({ token, postId })
                }

                post.likes.length = optimisticCount
            } catch (error) {
                console.error('Ошибка при обработке лайка:', error)
                alert('Произошла ошибка при попытке поставить лайк')

                const likeImg = likeButton.querySelector('img')
                const likesText = likeButton.nextElementSibling
                
                post.isLiked = !post.isLiked
                likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`
                likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`
            } finally {
                likeButton.dataset.loading = 'false'
            }
        })
    })
}

function setupDeleteHandlers({ user, isUserPostsPage }) {
    const deleteButtons = document.querySelectorAll('.delete-button')
    deleteButtons.forEach((button) => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation()
            if (!user) {
                alert('Для удаления необходимо авторизоваться')
                return
            }

            const confirmed = window.confirm('Удалить пост?')
            if (!confirmed) return

            const postId = button.dataset.postId
            try {
                await deletePost({ token: `Bearer ${user.token}`, postId })
                if (isUserPostsPage) {
                    // Обновим список постов пользователя
                    const list = await getUserPosts({ token: `Bearer ${user.token}`, userId: user.id })
                    // Простой путь — перезагрузить страницу, чтобы не усложнять логику локального состояния
                    location.reload()
                } else {
                    location.reload()
                }
            } catch (error) {
                console.error('Ошибка удаления поста:', error)
                alert('Не удалось удалить пост')
            }
        })
    })
}
