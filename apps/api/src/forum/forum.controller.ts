import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  forumPostSchema,
  forumTopicSchema,
  paginationSchema,
  type ForumPostDto,
  type ForumTopicDto,
  type PaginationDto,
} from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { ForumService } from './forum.service';

@ApiTags('forum')
@ApiBearerAuth()
@Controller('forum')
export class ForumController {
  constructor(private readonly forum: ForumService) {}

  @Get('topics')
  @CheckPolicies({ action: 'read', subject: 'Forum' })
  @UsePipes(new ZodValidationPipe(paginationSchema))
  listTopics(@Query() query: PaginationDto) {
    return this.forum.listTopics(query);
  }

  @Get('topics/:id')
  @CheckPolicies({ action: 'read', subject: 'Forum' })
  getTopic(@Param('id') id: string) {
    return this.forum.getTopic(id);
  }

  @Post('topics')
  @CheckPolicies({ action: 'create', subject: 'Forum' })
  @ApiOperation({ summary: 'Mavzu ochish' })
  createTopic(
    @Body(new ZodValidationPipe(forumTopicSchema)) dto: ForumTopicDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.forum.createTopic(dto, userId);
  }

  @Post('topics/:id/posts')
  @CheckPolicies({ action: 'create', subject: 'Forum' })
  @ApiOperation({ summary: 'Javob yozish' })
  createPost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(forumPostSchema)) dto: ForumPostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.forum.createPost(id, dto, userId);
  }

  @Post('posts/:postId/upvote')
  @CheckPolicies({ action: 'create', subject: 'Forum' })
  upvote(@Param('postId') postId: string) {
    return this.forum.vote(postId, 'up');
  }

  @Post('posts/:postId/downvote')
  @CheckPolicies({ action: 'create', subject: 'Forum' })
  downvote(@Param('postId') postId: string) {
    return this.forum.vote(postId, 'down');
  }
}
