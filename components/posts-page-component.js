import { USER_POSTS_PAGE } from '../routes.js'
import { renderHeaderComponent } from './header-component.js'
import { posts, goToPage } from '../index.js'
import { formatDistanceToNow } from ' https://cdn.jsdelivr.net/npm/date-fns@3/+esm'
import * as ruLocale from ' https://cdn.jsdelivr.net/npm/date-fns@3/locale/ru/+esm'
import { likePost, dislikePost, getPosts, deletePost } from '../api.js'
import { escapeHtml } from '../helpers.js'

export function renderPostsPageComponent({ appEl, user }) {
    const isCurrentUserPost = (post, currentUser) => {
        if (!currentUser || !post) return false
        const ownerId = post?.user?.id ?? post?.userId ?? post?.user?._id
        const currentUserId = currentUser?.id ?? currentUser?._id ?? currentUser?.user?.id
        return currentUserId != null && String(ownerId) === String(currentUserId)
    }
    const postsWithLikes = posts.map((post) => ({
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
                <ul class="posts">
                ${postsWithLikes
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
              </div>`

    appEl.innerHTML = appHtml

    try {
        const currentUserId = user?.id ?? user?._id ?? user?.user?.id
        const deleteButtonsCount = document.querySelectorAll('.delete-button').length
        console.log('[posts] currentUserId=', currentUserId, 'deleteButtons=', deleteButtonsCount)
    } catch {}

    renderHeaderComponent({
        element: document.querySelector('.header-container'),
        user,
    })

    setupDeleteHandlers({ user })

    setupLikeHandlers({
        posts: postsWithLikes,
        token: user ? `Bearer ${user.token}` : null,
        userId: user?.id,
    })

    document.querySelectorAll('.post-header').forEach((userEl) => {
        userEl.addEventListener('click', () => {
            console.log('Clicked user:', userEl.dataset.userId)
            goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId })
        })
    })
}

function setupDeleteHandlers({ user }) {
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
                // Перезагрузим ленту
                await getPosts({ token: `Bearer ${user.token}` })
                location.reload()
            } catch (error) {
                console.error('Ошибка удаления поста:', error)
                alert('Не удалось удалить пост')
            }
        })
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

                post.likes.length = optimisticCount
            } catch (error) {
                console.error('Ошибка при обработке лайка:', error)
                alert(`Ошибка: ${error.message}`)

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
