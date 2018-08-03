This page describes how a publication can be segmented using its ToC and its structure.
It describes how a navigation timeline can be setup in the app UI.

# Getting the overall progression in the publication

Using the [Locator API](locator-api.md) we can get the current progression in the current resource. 
If we need to draw a navigation timeline (this is the case in Readium Desktop) we need to get the overall progression in the publication. 

Let's imagine a publication with 3 spine items, of different sizes (let's say 8 "units" for the first, 4 for the second, 12 for the third): 

A basic graphical representation of the publication timeline could be:

![Publication timeline](publication-timeline.png)

What is this "unit" we talk about? it cannot be a height in pixels because it should be calculated without having to render each resource. For an html resource, it could be the size in bytes of the resource (markup included, before any decryption) or the size in characters of the content of the resource (markup excluded, after decryption). In both cases, the size of images or videos embedded in the content is not taken into account. 

Our choice is the size in bytes of the resource, which is an immediate value. It is felt that choosing another unit, more difficult to compute, would not add much more precision. 

Our goal is to compute the overall progression in the publication, knowing the progression in the current spine item and the size of each spine item. 

Let's consider that the current spine item is the second in reading order, and the current progression in this spine item is r (%).

![Publication timeline](publication-timeline-progression.png)

The relative size of each spine item is the size of the spine item divided by the sum of the sizes of all spine items. 
Let's call them S1, S2 and S3 (%).

It is now evident that the progression in the publication is the sum of the relative sizes of each spine item preceding the current one (S1 in our sample), plus the progression in the current spine item multiplied by the relative size of the current spine item (r*S2 in our sample).

With the values used for our sample, the result is (8/24 + 0,5*4/24) = 1/3 + 1/12 = 5/12. 

This value is not exact, because the unit used for calculating the size of spine items (bytes in a possibly encrypted file) is currently different from the unit used for calculating the progression in a spine item (pixels in a rendered web resource). Nevertheless, that approximation is sufficient to provide a good experience to the user. 





