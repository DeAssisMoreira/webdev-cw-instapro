import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { goToPage } from '../index.js'
import { formatDistanceToNow } from ' https://cdn.jsdelivr.net/npm/date-fns@3/+esm'
import * as ruLocale from ' https://cdn.jsdelivr.net/npm/date-fns@3/locale/ru/+esm'
import { likePost, getUserPosts } from '../api.js'

export function renderUserPostsPageComponent({ appEl, user, posts, page }) {
    const isUserPostsPage = page === USER_POSTS_PAGE
    const currentUser =
        isUserPostsPage && posts.length > 0 ? posts[0].user : null

    posts = posts.map((post) => ({
        ...post,
        likes: [],
        isLiked: false,
    }))

    const appHtml = `
        <div class="page-container">
            <div class="header-container"></div>
            ${
                currentUser
                    ? `
                <div class="posts-user-header">
                    <img src="${currentUser.imageUrl}" class="posts-user-header__user-image">
                    <p class="posts-user-header__user-name">${currentUser.name}</p>
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
                            <p class="post-header__user-name">${post.user.name}</p>
                        </div>
                        <div class="post-image-container">
                            <img class="post-image" src="${post.imageUrl}">
                        </div>
                        <div class="post-likes">
                            <button data-post-id="${post.id}" class="like-button">
                                <img src="./assets/images/like-not-active.svg"> 
                            </button>
                            <p class="post-likes-text">
                                Нравится: <strong>0</strong>
                            </p>
                        </div>
                        <p class="post-text">
                            <span class="user-name">${post.user.name}</span>
                            ${post.description}
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

            const post = posts.find((post) => post.id === postId)
            if (!post) return

            try {
                post.isLiked = !post.isLiked
                const likeImg = likeButton.querySelector('img')
                const likesText = likeButton.nextElementSibling

                if (post.isLiked) {
                    post.likes.push({ userId })
                    likeImg.src = './assets/images/like-active.svg'
                } else {
                    post.likes = post.likes.filter(
                        (like) => like.userId !== userId,
                    )
                    likeImg.src = './assets/images/like-not-active.svg'
                }
                likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`

                await likePost({ token, postId })

                const response = await getUserPosts({
                    token,
                    userId: post.user.id,
                })

                const updatedPost = response.find((p) => p.id === postId)
                if (updatedPost) {
                    post.likes = updatedPost.likes || []
                    post.isLiked = post.likes.some(
                        (like) => like.userId === userId,
                    )

                    likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`
                    likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`
                }
            } catch (error) {
                console.error('Ошибка при обработке лайка:', error)
                alert('Произошла ошибка при попытке поставить лайк')

                post.isLiked = !post.isLiked
                if (post.isLiked) {
                    post.likes.push({ userId })
                } else {
                    post.likes = post.likes.filter(
                        (like) => like.userId !== userId,
                    )
                }

                const likeImg = likeButton.querySelector('img')
                likeImg.src = `./assets/images/${post.isLiked ? 'like-active.svg' : 'like-not-active.svg'}`

                const likesText = likeButton.nextElementSibling
                likesText.innerHTML = `Нравится: <strong>${post.likes.length}</strong>`
            }
        })
    })
}
