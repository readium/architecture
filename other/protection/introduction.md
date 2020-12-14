# Introduction to the protection of Web Publication

The concept of reading books - i.e. long-form publications - in a Web browser emerged around 2010. It rapidly got some traction and the organization of the [Books in Browsers](https://booksinbrowsers.org/past-bibs/) event, between 2011 and 2016, is a good illustration of the raise and fall of the concept. 

The idea of moving ebooks to the Web was reactivated in 2017 by W3C members of the Publishing Working Group ([Charter](https://www.w3.org/2017/04/publ-wg-charter/)). EDRLab was member of this Working Group and promoted there the use of the Readium Web Publication Manifest for representing Web Publications. But the result of this work, the [Web Publications specification](https://www.w3.org/TR/wpub/), wasn't adopted by content providers and was therefore published as a W3C Note, not a Recommandation.    

In many ways, it was the lack of content protection technologies for browsers that slowed down books in browsers. Without specific protection measures, it is really easy for users to copy or download copyrighted publications, convert them  in any format they like (including EPUB and PDF) and share them widely. And this is something most publishers really fear. 

The wisdom of the Web is "if you don't want it to be shared, don't share it on the Web". No protection technology can fully protect Web content against copy. Web browsers are "transparent" when it come to textual and image content: Web content and code can be debugged in inspector tools and no secret can stay hidden for long. Only video (and therefore audio) content may be protected by a DRM, using Encrypted Media Extensions and specialized Content Decryption Modules. With the exception of video, no protection technique of Web content can be called a "DRM".  

That said, Amazon, Overdrive and a few others have developed browser based interfaces for commercial ebooks for years now; some were abandoned, some are still alive. These content providers have used different techniques to make the content harder to copy. Some approaches are fairly outdated at this point, but still appear to be acceptable to most publishers. Other more modern technologies, most of it open source, are far more robust. 

The goal of this work is to provide guidelines to developers of Web Readers who need to achieve some level of protection for copyright protected Web Publications consumed by Web applications.  

However it cannot be a definitive guide, as:
- Web technologies are constantly evolving, offering new means of protection and pushing others to deprecation.
- A unique way of protecting Web content would be easily defeated with one-click solutions. 

Note also that care has been taken to avoid heavy processing which would drastically slow down the preparation and rendering of Web content.

This work is therefore split into three parts:

- A list of aspects of Web content which allow free copy in the absence of protection techniques (the "problems");
- Server and client techniques recommended for the protection of Web content (the "solutions");
- An online Proof of Concept of the differents recommended "solutions". This sample is online at https://webpub-protect.herokuapp.com/app/ and will be updated during the year 2021. 

Publishers who think that the solutions presented here provide an insufficient level of protection for their content should consider distributing their publications to [LCP](https://www.edrlab.org/readium-lcp/) compliant mobile / desktop applications and e-ink devices only. 




