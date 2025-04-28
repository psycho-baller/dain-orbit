# Orbit - Find Your Circle

- Short intro on what Orbit is: <https://youtu.be/j6hW2_G6HCQ>
- Demo of Orbit in action: <https://youtu.be/Ksm0Xa9MfkU>
- Landing page: <https://v0-futuristic-coffee-website.vercel.app/>
- Devpost submission: <https://devpost.com/software/orbit-w84iq1>

## Inspiration

As my team and I were brainstorming what problem we wanted to solve, we realized the biggest challenge we all face in university is not knowing who to talk to and not having the time to meet new people. So we thought — what if we could automate everything standing between people and their perfect circle? That’s where the idea of Orbit came to life.
Whether you're looking for a co-founder, a mentor, a mentee, a life partner, or simply a friend that can keep you accountable. We strongly believe if you’re able to easily control who you surround yourself with. Growth and change will come easy. And of course, as we all know in this day and age, it’s not about what you know, it’s about who you know.
So with that vision fueling and exciting us. We started imagining a world where Butterfly, your AI friend and personal assistant, knows everyone around you and is able to effortlessly connects you with the perfect person to meet.

## What it does

1. Inputs - Profile Creation:
Users start by speaking naturally on a quick onboarding call with AI or sharing your notes through note-taking tools like Notion or Obsidian. Orbit captures these thoughts — ideas, goals, interests, and aspirations — and automatically constructs a detailed personal profile from the conversation transcript.

2. Processing - Smart Matching:
Orbit searches a database of 350,000 UCLA alumni, or uses the "search-users" tool, to find potential matches based on emotional fit, professional goals, and shared interests. It uses a vector database to power smarter, more nuanced matchmaking based on best-fit Give & Take sections in their profiles.

3. Output 1 - Warm Introduction:
Once a strong match is found, Orbit drafts a personalized warm introduction email that explains why both users complement each other. Speaking as an AI "friend" who knows them both, the message highlights shared goals, skills, and how they can support each other's growth.

4. Output 2 - Scheduling Meetups:
After the email is confirmed, Orbit sends it out, coordinates schedules, and proposes a meetup. Either in person if they’re nearby, or virtually if they’re far apart. Calendar invites are automatically generated with the location and meeting details included.

5. Output 3 - Small Talk Summary:
Before the meeting, Orbit generates a "Things You Should Know About Each Other" guide. It highlights small talk topics, interesting overlaps, and deeper conversation starters based on both users' profiles — helping them skip the awkward beginnings and dive into meaningful discussions from the start.

In short, Orbit removes the randomness and lack of intentionality from networking. It helps users find the right people, build real connections, and make the most out of every conversation.

## How we built it

Our platform uses VAPI to go on a 5-10 minute phone call to get to know the user. DAIN then processes these conversations to build detailed emotional and personality profiles, analyzing tone, sentiment, and conversational patterns. We enrich these profiles using the LinkedIn API, adding professional context like career fields and skills. Finally, we encode the profiles into high-dimensional vectors and store them in a vector database, enabling AI-powered matching that connects users based on emotional needs, interests, and shared experiences.

## Challenges we ran into

One major challenge we faced was integrating all the services we created with DAIN. Each part of the system, from voice capture to profile generation to enrichment and matching, had to work together seamlessly, but getting them to communicate reliably was harder than expected. We spent a lot of time debugging asynchronous issues and prompt engineering these agents to do what we wanted them to do.

## Accomplishments that we're proud of

Successfully syncing all of DAIN's services and making them automomously interact with each other. One example is getting the profile details from the call then automatically extracting the key points to create the user profile to store into the vector database. When we made the first call that automatically called each agent at the right time, 3 of our team members jumped up in excitement—a mission that we were working towards for 20 hours was finally showing results.

## What we learned

Two of our team members, being first years, were able to learn a lot from another team member who has much more experience. We learned a lot of how APIs are linked together, how vector databases store information and the drawbacks as well as benefits of using them as opposed to traditional ones. The overall experience taught us that communication is truly valuable, especially when relying on others to do work on one project.
Another thing is planning ahead so we have a clear vision of our ultimate goal.

## What's next for Orbit - Find Your Circle

We're hoping to expand Orbit past its current horizons by adding even more integrations with other platforms to make it even easier and frictionless to connect with the perfect person to meet. We also plan to add multilingual support and profitabilities. A premium subscription, coming at a reasonable cost, will allow users to generate more search requests and enhance their searches with extra filters, specifications and services for their convenience. We know English isn't the only language in the world, so adding multilingual support will continue to reach for the stars by breaking down another barrier; the language barrier.

## Built With

VAPI AI commences a phone call with the user to learn more about the user. Built on DAIN's vector database which stores the user's interests, weaknesses and strengths, Linkd's API scrapes Linkedin profiles to find personal similarities within profiles. Proxycurl, an email scraper, then finds work emails from these profiles to share to the user. Cloudflare maintains multimodal security for the program in case of potential security hazards. This all ends in an AI email generator, allowing for students to have a quick, warm and easy introduction to other people who have much in common with them.

- [VAPI](https://vapi.ai/)
- [DAIN](https://dain.dev)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [LinkedIn](https://www.linkedin.com/)
- [Proxycurl](https://proxycurl.com/)
- [Notion](https://www.notion.so/)
- [Obsidian](https://obsidian.md/)
- [Cloudflare](https://www.cloudflare.com/)
- [Vector Database](https://developers.cloudflare.com/vectorize/get-started/intro/)
