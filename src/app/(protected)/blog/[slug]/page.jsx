async function getAllPosts() {
  // Fetch all posts from your data source (e.g., database, API)
  return Promise.resolve([
    { slug: '1', title: 'Post 1', content: 'Content of Post 1' },
    { slug: '2', title: 'Post 2', content: 'Content of Post 2' },
    // Add more posts as needed
  ]);
}

async function getPost(slug) {
  // Fetch a single post by its slug from your data source
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

async function getVisitorCount(slug) {
  // Fetch the visitor count for the post with the given slug
  // This could be from a database or an analytics service
  return Math.floor(Math.random() * 1000); // Example: random visitor count
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const views = await getVisitorCount(slug); // per-request

  return (
    <article>
      <h1>{post.title}</h1>
      <span>{views} views</span>
      <div>{post.content}</div>
    </article>
  );
}
