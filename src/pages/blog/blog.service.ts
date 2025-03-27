import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Post } from 'types/blog.type'
// Nếu bên slice chúng ta dùng createSlice để tạo slice thì bên RTK query dùng createApi
// Với createApi chúng ta gọi là slice api
// Chúng ta sẽ khai báo baseUrl và các endpoints

// baseQuery được dùng cho mỗi endpoint để fetch api

// fetchBaseQuery là một function nhỏ được xây dựng trên fetch API
// Nó không thay thế hoàn toàn được Axios nhưng sẽ giải quyết được hầu hết các vấn đề của bạn
// Chúng ta có thể dùng axios thay thế cũng được, nhưng để sau nhé

// endPoints là tập hợp những method giúp get, post, put, delete... tương tác với server
// Khi khai báo endPoints nó sẽ sinh ra cho chúng ta các hook tương ứng để dùng trong component
// endpoints có 2 kiểu là query và mutation.
// Query: Thường dùng cho GET
// Mutation: Thường dùng cho các trường hợp thay đổi dữ liệu trên server như POST, PUT, DELETE

// Có thể ban đầu mọi người thấy nó phức tạp và khó hiểu
// Không sao, mình cũng thể, các bạn chỉ cần hiểu là đây là cách setup mà RTK query yêu cầu
// Chúng ta chỉ cần làm theo hướng dẫn là được

/**
 * Mô hình sync(đồng bộ) dữ liệu danh sách bài post dưới local sau khi thêm 1 bài post
 * Thường sẽ có 2 cách tiếp cận
 * Cách 1: Đây là cách những video trước đây mình dùng
 * 1. Sau khi thêm 1 bài post thì server sẽ trả về data của bài post đó
 * 2. Chúng ta sẽ tiến hành lấy data đó thêm vào state redux
 * 3. Lúc này UI chúng ta sẽ được sync
 *
 * ====> Rủi ro cách này là nếu khi gọi request add post mà server trả về data không đủ các field để
 * chúng ta hiển thị thì sẽ gặp lỗi. Nếu có nhiều người cùng add post thì data sẽ sync thiếu,
 * Chưa kể chúng ta phải quản lý việc cập nhật state nữa, hơi mệt!
 *
 *
 * Cách 2: Đây là cách thường dùng với RTK query
 * 1. Sau khi thêm 1 bài post thì server sẽ trả về data của bài post đó
 * 2. Chúng ta sẽ tiến hành fetch lại API get posts để cập nhật state redux
 * 3. Lúc này UI chúng ta sẽ được sync
 *
 * =====> Cách này giúp data dưới local sẽ luôn mới nhất, luôn đồng bộ với server
 * =====> Khuyết điểm là chúng ta sẽ tốn thêm một lần gọi API. Thực ra thì điều này có thể chấp nhận được
 */
export const blogApi = createApi({
  reducerPath: 'blogApi', //Tên field trong Redux state
  tagTypes: ['Posts'], //Những kiểu tag cho phép dùng trong blogApi, giúp quản lý ép thằng nào gọi API lại ko
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000' }),
  endpoints: (build) => ({
    //Generic type theo thứ tự là kiểu response trả về và argument
    getPosts: build.query<Post[], void>({
      query: () => 'posts', //method ko cos argument
      providesTags(result) {
        /**
         * Cái callback này sẽ chạy mỗi khi getPosts chạy
         * Mong muốn là sẽ return về một mảng kiểu
         * interface Tags: {
         *  typpe:"Posts",
         *  id:string
         * }[]
         *
         * vì thế phải thêm as const vào để báo hiệu type là Read only ko thể mutate
         * 
         * Giải thích: vòng map
         * 
         * result là mảng các bài viết, mỗi bài có một id.

         *.map(({ id }) => ({ type: 'Posts' as const, id })):

         * Mỗi bài viết sẽ được gán một tag kiểu { type: 'Posts', id }.

         * { type: 'Posts' as const, id }:

         * type: 'Posts' as const → đảm bảo type là chuỗi cố định (readonly).

         * id: ID của từng bài viết.

         * Ví dụ, nếu API trả về 2 bài viết có id: 1 và id: 2, nó sẽ tạo danh sách tag:
         * [
              { type: 'Posts', id: 1 },
              { type: 'Posts', id: 2 }
            ]
         * Sau khi tạo danh sách tag cho từng bài viết, nó thêm một tag đặc biệt:
            { type: 'Posts', id: 'LIST' }
           =>  Đây là tag chung cho toàn bộ danh sách bài viết.
          * Nếu API trả về danh sách bài viết:
           [
              { "id": 1, "title": "Post 1" },
              { "id": 2, "title": "Post 2" }
            ]
            Thì final sẽ có:
            [
              { type: 'Posts', id: 1 },
              { type: 'Posts', id: 2 },
              { type: 'Posts', id: 'LIST' }
            ]

         */
        if (result) {
          const final = [
            ...result.map(({ id }) => ({ type: 'Posts' as const, id })),
            { type: 'Posts' as const, id: 'LIST' }
          ]
          return final
        }
        //nếu result là false <=> gọi API lội thì chạy dòng này
        const final = [{ type: 'Posts' as const, id: 'LIST' }]
        return final
      }
    }),

    /** Dùng mutation đối với các trường hợp Post, Put, Delete
     *
     */
    //Post kiểu response trả về, Omit<Post,'id'> kiểu dữ liệu gửi lên
    addPost: build.mutation<Post, Omit<Post, 'id'>>({
      query: (body) => {
        return {
          url: 'posts',
          method: 'POST',
          body
        }
      },
      /**
       * invalidatesTags cung cấp các tag để báo hiệu cho những method nào có providesTags
       * match với [{ type: 'Posts', id: 'LIST' }] sẽ bị gọi lại
       * Trong trường hợp này getPosts sẽ chạy lại
       *
       */
      invalidatesTags: (result, error, body) => [{ type: 'Posts', id: 'LIST' }]
    }),
    //Lấy bài post muốn update
    getPost: build.query<Post, string>({
      query: (id) => `posts/${id}`
    }),
    //update bài post
    updatePost: build.mutation<Post, { id: string; body: Post }>({
      query(data) {
        return {
          url: `posts/${data.id}`,
          method: 'PUT',
          body: data.body
        }
      },
      //vì update bài post nên mk có id nên truyền id của bài post vào  để gọi lai API ko mk đê là 'LIST' cũng ko sao
      invalidatesTags: (result, error, data) => [{ type: 'Posts', id: data.id }]
    }),
    //DELETE POST
    deletePost: build.mutation<{}, string>({
      query(id) {
        return {
          url: `posts/${id}`,
          method: 'DELETE'
        }
      },
      // gọi lại API getPosts sau khi xóa 1 post
      invalidatesTags: (result, error, id) => [{ type: 'Posts', id: id }]
    })
  })
})
//endpoints tự sinh ra các hooks tương ứng để sử dụng trong các component
export const { useGetPostsQuery, useAddPostMutation, useGetPostQuery, useUpdatePostMutation, useDeletePostMutation } =
  blogApi
