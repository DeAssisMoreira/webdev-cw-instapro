import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { goToPage } from '../index.js'
import { formatDistanceToNow } from ' https://cdn.jsdelivr.net/npm/date-fns@3/+esm'
import * as ruLocale from ' https://cdn.jsdelivr.net/npm/date-fns@3/locale/ru/+esm'
import { likePost, dislikePost, getUserPosts } from '../api.js'
import { escapeHtml } from '../helpers.js'

export function renderUserPostsPageComponent({ appEl, user, posts, page }) {
    const isUserPostsPage = page === USER_POSTS_PAGE
    const currentUser =
        isUserPostsPage && posts.length > 0 ? posts[0].user : null

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
                        (post) => `
                    <li class="post">
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
                        </div>
                        <p class="post-text">
                            <span class="user-name">${escapeHtml(post.user.name)}</span>
                            ${escapeHtml(post.description)}
                        </p>
                        <p class="post-date">
                            ${formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: ruLocale.default,
                            })}
                        </p>
                    </li>
                `,
                    )
                    .join('')}
            </ul>
        </div>
    `

    appEl.innerHTML = appHtml

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })

    setupLikeHandlers({
        posts,
        token: user ? `Bearer ${user.token}` : null,
        userId: user?.id,
    })
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

                const response = await getUserPosts({
                    token,
                    userId: post.user.id,
                })

                const updatedPost = response.find((p) => String(p.id) === String(postId))
                if (updatedPost) {
                    post.likes = updatedPost.likes || []
                    post.isLiked = post.likes.some(
                        (like) =>
                            like?.userId === userId ||
                            like?.id === userId ||
                            like?.user?.id === userId,
                    )

                    likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`
                    likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`
                }
            } catch (error) {
                console.error('Ошибка при обработке лайка:', error)
                alert('Произошла ошибка при попытке поставить лайк')

                const likeImg = likeButton.querySelector('img')
                post.isLiked = !post.isLiked
                likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`
                const likesText = likeButton.nextElementSibling
                likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`
            } finally {
                likeButton.dataset.loading = 'false'
            }
        })
    })
}
