import { Controller, Get, Redirect } from "@nestjs/common";

@Controller()
export class RootController {
  @Get()
  @Redirect("/feed", 302)
  redirectToFeed() {
    return;
  }
}
