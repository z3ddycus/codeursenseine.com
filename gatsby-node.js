const path = require(`path`)
const slugify = require(`slugify`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions

  createRedirect({
    fromPath: "/2019",
    toPath: "https://archive.codeursenseine.com/2019",
    isPermanent: true,
  })

  // -------------------- CREATING MEETUPS PAGE ---------------------
  const meetups = await graphql(
    `
      {
        allMdx(
          sort: { fields: frontmatter___meetup_date, order: DESC }
          filter: { frontmatter: { published: { ne: false } } }
        ) {
          edges {
            node {
              id
              frontmatter {
                slug
                published
              }
              parent {
                ... on File {
                  name
                  relativeDirectory
                  sourceInstanceName
                }
              }
            }
          }
        }
      }
    `
  )

  // TODO Check if it is really useful.
  if (meetups.errors) {
    throw meetups.errors
  }

  // Create meetup post pages.
  const meetupsEdges = meetups.data.allMdx.edges

  meetupsEdges.forEach((meetup) => {
    if (meetup.node.parent.sourceInstanceName === "meetups") {
      createPage({
        path: `/meetups/events/${slugify(meetup.node.frontmatter.slug, {
          strict: true,
          lower: true,
        })}`,
        component: path.resolve(`./src/templates/MeetupPost/index.js`),
        context: {
          id: meetup.node.id,
        },
      })
    }
  })

  // -------------------------- CREATING ORGANISERS PAGE -----------------------
  const organisersQuery = await graphql(`
    {
      site {
        siteMetadata {
          currentYear
        }
      }
      allFile(
        filter: {
          sourceInstanceName: { eq: "organisers" }
          extension: { eq: "mdx" }
        }
        sort: { fields: childMdx___frontmatter___name }
      ) {
        nodes {
          childMdx {
            frontmatter {
              name
              image {
                publicURL
              }
              twitter
              github
              linkedin
            }
          }
        }
      }
    }
  `)

  createPage({
    // todo : get current year
    path: `/${organisersQuery.data.site.siteMetadata.currentYear}/organisateurs`,
    component: path.resolve(`./src/templates/Organisers/index.js`),
    context: {
      organisers: organisersQuery.data.allFile.nodes,
    },
  })

  return null
}
