import { Controller, Get, Redirect } from "@nestjs/common";

@Controller()
export class RootController {
  @Get()
  @Redirect("/dates/feed", 302)
  redirectToDatesFeed() {
    return;
  }
}
