import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { FastifyPluginAsync } from 'fastify'

const swaggerPlugin: FastifyPluginAsync = async (fastify, options) => {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Muses Music API',
        description: '音乐流媒体服务 API 文档',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
        },
      ],
    },
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
}

export default fp(swaggerPlugin)
