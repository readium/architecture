# Requirements for a new navigator

- Support for mixed reflowable/FXL EPUBs									OPTIONAL
- Support for other types of mixed publications								OPTIONAL


## Support for Reflowable HTML publications									REQUIRED

- Support for spread, page, fit, clipped properties							MEANINGLESS
- Support for multiple columns inside one resource							REQUIRED
- Support for publication-level orientation property						REQUIRED
- Support for resource-level orientation property							MEANINGLESS

- continuous=true, overflow=scrolled, progression=TTB/BTT, text-progression=LTR/RTL			WOULD BE GREAT
- continuous=true, overflow=scrolled, progression=LTR/RTL, text-progression=TTB/BTT			OPTIONAL
- continuous=true, overflow=scrolled, progression=TTB/BTT, text-progression=TTB/BTT			OPTIONAL (i)
- continuous=true, overflow=scrolled, progression=LTR/RTL, text-progression=LTR/RTL			OPTIONAL (i)

i) Might be difficult to do with CSS columns.

- continuous=true, overflow=paginated, progression=any, text-progression=any				OPTIONAL

- continuous=false, overflow=scrolled, progression=TTB/BTT, text-progression=LTR/RTL		OPTIONAL
- continuous=false, overflow=scrolled, progression=LTR/RTL, text-progression=TTB/BTT		OPTIONAL
- continuous=false, overflow=scrolled, progression=TTB/BTT, text-progression=TTB/BTT		REQUIRED
- continuous=false, overflow=scrolled, progression=LTR/RTL, text-progression=LTR/RTL		REQUIRED

- continuous=false, overflow=paginated, progression=any, text-progression=any				REQUIRED


## Support for Fixed-layout HTML publications											REQUIRED

- spread=no, continuous=true, overflow=scrolled, progression=any						WOULD BE GREAT
- spread=no, continuous=true, overflow=paginated, progression=any						OPTIONAL
- spread=no, continuous=false, overflow=scrolled, progression=any						REQUIRED
- spread=no, continuous=false, overflow=paginated, progression=any						WOULD BE GREAT

- spread=mixed, page=any, continuous=any, overflow=any, progression=TTB/BTT				MEANINGLESS

- spread=mixed, page=any, continuous=true, overflow=scrolled, progression=LTR/RTL		WOULD BE GREAT
- spread=mixed, page=any, continuous=true, overflow=paginated, progression=LTR/RTL		OPTIONAL

- spread=mixed, page=any, continuous=false, overflow=scrolled, progression=LTR/RTL		REQUIRED
- spread=mixed, page=any, continuous=false, overflow=paginated, progression=LTR/RTL		OPTIONAL

- Support for publication-level orientation property									REQUIRED
- Support for fit and clipped properties												USELESS

ISSUE FXL1: Device orientation may change depending on the orientation property of the current resource.
What if two resources are shown together in continuous mode?

## Support for Image-based Publications		REQUIRED

In the simplest variant, fit is set depending on the reading progression.
- continuous=true, progression=TTB/BTT: fit = width
- continuous=true, progression=LTR/RTL: fit = height
- continuous=false, progression=any: fit = contain

Even in this basic case, overflow can happen because of zooming.

- continuous=true, overflow=scrolled, progression=any			REQUIRED
- continuous=false, overflow=scrolled, progression=any			REQUIRED

Issue IMG1 : In order to support the two following combinations, we need to decide what to do
if there is an overflow due to zooming in the orientation opposed to the reading progression
(for instance a horizontal overflow in TTB).

- continuous=true, overflow=paginated, progression=any			OPTIONAL	
- continuous=false, overflow=paginated, progression=any			OPTIONAL

Issue IMG2 : What does the resource-level orientation property mean?
- Resource should be rotated OR
- Device orientation should be changed depending on the current resource. What about continuous mode?

Issue IMG3 : Introducing different values for fit would raise the following issues :


Issue IMG4 : Supporting the clipped property would raise the following issues :







