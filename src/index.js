#!/usr/bin/env node

import yargs from 'yargs'
import Queue from 'bull'
import winston from 'winston'
import optimizeImageJob from './job'

const REDIS_CONFIG = {
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || '127.0.0.1',
  password: process.env.REDIS_PASSWORD
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'image-processing' },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
})

const queueOptions = {
  redis: REDIS_CONFIG
}

yargs // eslint-disable-line
  .command('run [name]', 'starts image processing queue', (yargs) => {
    yargs
      .positional('name', {
        type: 'string',
        describe: 'queue name',
        default: 'convert'
      })
  }, (argv) => {
    const queue = new Queue(argv.name, queueOptions)

    queue.process(optimizeImageJob)

    queue.on('error', (err) => {
      logger.error(err)
    })

    queue.on('failed', (job, err) => {
      logger.error(err)
    })

    queue.on('paused', () => {
      logger.info('job paused')
    })

    queue.on('resumed', (job) => {
      logger.info('job resumed')
    })

    queue.on('cleaned', (jobs, type) => {
      logger.info('job cleaned')
    })

    queue.on('drained', () => {
      logger.info('job drained')
    })

    queue.on('removed', (job) => {
      logger.info('job removed')
    })
  })
  .help()
  .argv
