import { FastifyPluginAsync } from 'fastify'
import crypto from 'node:crypto'

// 密码哈希函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

const auth: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  // 注册
  fastify.post<{
    Body: { username: string; password: string }
  }>('/auth/register', {
    schema: {
      description: '用户注册',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body

    try {
      const user = await fastify.prisma.user.create({
        data: {
          username,
          password: hashPassword(password),
        },
      })

      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return reply.status(409).send({ success: false, message: '用户名已存在' })
      }
      throw error
    }
  })

  // 登录
  fastify.post<{
    Body: { username: string; password: string }
  }>('/auth/login', {
    schema: {
      description: '用户登录',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    username: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body

    const user = await fastify.prisma.user.findUnique({
      where: { username },
    })

    if (!user || user.password !== hashPassword(password)) {
      return reply.status(401).send({ success: false, message: '用户名或密码错误' })
    }

    const token = crypto.randomBytes(32).toString('hex')

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    }
  })
}

export default auth
