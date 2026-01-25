import { FastifyPluginAsync } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

const songs: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  // 获取歌曲列表
  fastify.get('/songs', {
    schema: {
      description: '获取所有歌曲列表',
      tags: ['Songs'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  artist: { type: 'string' },
                  album: { type: 'string' },
                  cover: { type: 'string', nullable: true },
                  duration: { type: 'integer' },
                  filePath: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const songs = await fastify.prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: songs }
  })

  // 获取单个歌曲
  fastify.get<{ Params: { id: string } }>('/songs/:id', {
    schema: {
      description: '获取单个歌曲信息',
      tags: ['Songs'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                id: { type: 'integer' },
                title: { type: 'string' },
                artist: { type: 'string' },
                album: { type: 'string' },
                cover: { type: 'string', nullable: true },
                duration: { type: 'integer' },
                filePath: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const id = parseInt(request.params.id)
    const song = await fastify.prisma.song.findUnique({
      where: { id },
    })

    if (!song) {
      return reply.status(404).send({ success: false, message: '歌曲不存在' })
    }

    return { success: true, data: song }
  })

  // 创建歌曲
  fastify.post<{
    Body: { title: string; artist: string; album: string; cover?: string; duration: number; filePath: string }
  }>('/songs', {
    schema: {
      description: '添加新歌曲',
      tags: ['Songs'],
      body: {
        type: 'object',
        required: ['title', 'artist', 'album', 'duration', 'filePath'],
        properties: {
          title: { type: 'string' },
          artist: { type: 'string' },
          album: { type: 'string' },
          cover: { type: 'string' },
          duration: { type: 'integer', minimum: 0 },
          filePath: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
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
    const { title, artist, album, cover, duration, filePath } = request.body

    try {
      const song = await fastify.prisma.song.create({
        data: {
          title,
          artist,
          album,
          cover: cover || null,
          duration,
          filePath,
        },
      })

      return { success: true, data: song }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return reply.status(409).send({ success: false, message: '歌曲已存在' })
      }
      throw error
    }
  })

  // 删除歌曲
  fastify.delete<{ Params: { id: string } }>('/songs/:id', {
    schema: {
      description: '删除歌曲',
      tags: ['Songs'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const id = parseInt(request.params.id)

    await fastify.prisma.song.delete({
      where: { id },
    })

    return { success: true, message: '删除成功' }
  })

  // 流式传输音乐文件
  fastify.get<{ Params: { id: string } }>('/songs/:id/stream', {
    schema: {
      description: '获取音频流（支持断点续传）',
      tags: ['Songs'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      produces: ['audio/mpeg'],
      response: {
        200: {
          type: 'string',
          format: 'binary'
        },
        206: {
          type: 'string',
          format: 'binary'
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const id = parseInt(request.params.id)
    const song = await fastify.prisma.song.findUnique({
      where: { id },
    })

    if (!song) {
      return reply.status(404).send({ success: false, message: '歌曲不存在' })
    }

    const absolutePath = path.resolve(song.filePath)

    if (!fs.existsSync(absolutePath)) {
      return reply.status(404).send({ success: false, message: '音乐文件不存在' })
    }

    const stat = fs.statSync(absolutePath)

    reply.header('Content-Type', 'audio/mpeg')
    reply.header('Content-Length', stat.size)
    reply.header('Accept-Ranges', 'bytes')

    const range = request.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1

      reply.status(206)
      reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`)
      reply.header('Content-Length', chunkSize)

      const stream = fs.createReadStream(absolutePath, { start, end })
      return reply.send(stream)
    }

    const fileStream = fs.createReadStream(absolutePath)
    return reply.send(fileStream)
  })

  // 扫描音乐目录
  fastify.post<{ Body: { directory: string } }>('/songs/scan', {
    schema: {
      description: '扫描音乐目录，自动导入歌曲',
      tags: ['Songs'],
      body: {
        type: 'object',
        required: ['directory'],
        properties: {
          directory: { type: 'string', description: '音乐目录路径' }
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
                added: { type: 'integer', description: '新增歌曲数量' },
                songs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      artist: { type: 'string' },
                      album: { type: 'string' },
                      duration: { type: 'integer' },
                      filePath: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { directory } = request.body
    const absoluteDir = path.resolve(directory)

    if (!fs.existsSync(absoluteDir) || !fs.statSync(absoluteDir).isDirectory()) {
      return reply.status(400).send({ success: false, message: '目录不存在或不是有效目录' })
    }

    const supportedExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac']
    const addedSongs: Array<{ title: string; artist: string; album: string; duration: number; filePath: string }> = []

    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          scanDir(fullPath)
        } else if (supportedExtensions.includes(path.extname(entry.name).toLowerCase())) {
          try {
            const filename = path.basename(entry.name, path.extname(entry.name))
            const parts = filename.split(' - ')
            const title = parts.length > 1 ? parts[1] : filename
            const artist = parts.length > 1 ? parts[0] : '未知艺术家'

            fastify.prisma.song.create({
              data: {
                title,
                artist,
                album: '未知专辑',
                duration: 0,
                filePath: fullPath,
              },
            })

            addedSongs.push({ title, artist, album: '未知专辑', duration: 0, filePath: fullPath })
          } catch {
            // 忽略已存在的文件
          }
        }
      }
    }

    scanDir(absoluteDir)

    return {
      success: true,
      data: {
        added: addedSongs.length,
        songs: addedSongs,
      },
    }
  })
}

export default songs
