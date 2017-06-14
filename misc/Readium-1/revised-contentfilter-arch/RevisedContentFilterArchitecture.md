#Revised ContentFilter Architecture for Readium SDK

Prepared by Bluefire Productions


##Motivation
This document was created to describe the process that the Readium Foundation undertook to try and make the Readium SDK work with the types of encrypted files that are created by modern DRM systems. During that process we found that the original SDK design would not work for these types of files and we therefore implemented two revisions to accomodate encrypted EPUBs. The results are documented (somewhat exhaustively) herein.

##Original ContentFilter Architecture

In the following text, we describe parts of the original ContentFilter architecture in Readium SDK. 

###Basic Concepts

As Readium SDK was originally implemented, it had already created a design for dealing with different forms of content inside a given ePUB file. That design was based upon the concept of ContentFilter objects.

* Launcher: a launcher is any piece of software that uses the Readium SDK to open and read an ePUB3 file. Currently, the Readium Consortium is working on 4 demonstration launchers for each major computing platform: iOS, OS X, Android and Windows. However, a launcher can be any reading software that uses the Readium SDK to process an ePUB3 file.
* ContentFilter: ContentFilter objects follow the classic definition of a “filter” in Computer Science. As in: an entity that receives bytes on its input, operates over those bytes, and outputs those modified bytes. In the case of Readium SDK, there will be different ContentFilter classes, which will operate on different kinds of resources an they will operate on the bytes belonging to those resources. You can see a better description of the code path for ContentFilter objects in the subsection below.

###Legacy (“old”) code path for ContentFilter objects

In order for ContentFilter objects to operate, the following code path is taken. The name of the classes that are involved in the process will be given below, as well as the name of some selected functions.

1. When the Launcher starts, it will have code to do the initialization of the Readium SDK.
2. At the initialization of the Readium SDK, each different ContentFilter class will register itself in the FilterManager. The FilterManager is an object that keeps track of all the currently existing ContentFilter classes and that will generate an instance of a ContentFilter when it is appropriate.
3. The Launcher opens an ePUB file. It then gets the Package object that corresponds to it.
4. Then, the Launcher requests the bytes through the function Package::GetFilterChainByteStream()
5. The Package object contains a reference to a FilterChain object. When Package receives the call to GetFilterChainByteStream(), it will ask the FilterChain object to return a new instance of the FilterChainByteStream class.
6. FilterChain builds a new instance of FilterChainByteStream. It accesses the FilterManager to find out, given the resource in question, which ContentFilter classes apply. For each ContentFilter class that applies, a new ContentFilter instance will be made and passed to FilterChainByteStream.
7. In addition, for each ContentFilter object that is created, FilterChain will create a FilterContext object. FilterContext is an abstract class, and each ContentFilter class defines its own subclass of FilterContext. Then, each specific FilterContext class will contain the information that its associated ContentFilter class may need to do its filtering. Once the FilterContext object is created, it is given to the ContentFilter object that was just created.
8. The new instance of FilterChainByteStream is returned to the Launcher.
9. FilterChainByteStream is a subclass of ByteStream. As such, it has the ReadData() method, to fill a buffer of bytes based on the data it contains.
10. The Launcher instantiates a buffer of bytes and passes it to the FilterChainByteStream via ReadData().
11. Inside ReadData(), FilterChainByteStream will take the following steps. FilterChainByteStream contains a reference to a ZipFileByteStream object. The ZipFileByteStream object is just a wrapper around the libzip code. This specific object will be pointing at the raw bytes that correspond to the given resource. Then, when the call to ReadData() is made, first FilterChainByteStream will read some bytes from ZipFileByteStream, corresponding to some bytes out of the resource.
12. FilterChainByteStream will put those bytes into a buffer, and pass that buffer to the first ContentFilter object in the chain of filters. It calls ContentFilter::FilterData() to do so.
13. The first ContentFilter object in the chain receives the buffer of bytes in its input, and operates on those bytes. It then overwrites the buffer with the new bytes.
14. FilterChainByteStream gets the buffer with the new bytes and passes that buffer to the next ContentFilter object in the chain, which will then operate on top of those bytes.
15. The process repeats until all the ContentFilter objects in the chain have operated on top of the bytes, one after the other.
16. FilterChainByteStream returns the operated bytes to the Launcher.

That is the basic process of reading bytes from a resource in an ePUB file, passing through ContentFilter objects. In the following section, we will describe how this process had to be modified to deal with byte ranges, the difficulties it still faced after that, and the final proposal to deal with those difficulties.

##First revision to the ContentFilter Architecture (byte ranges)

###Rationale for the first revision

As stated previously, work was originally undertaken to try to use the architecture described in the section above to read encrypted eBooks. Immediately we faced an issue regarding how resources were read.
The problem was the following:

* Some of the resources that can be contained in an ePUB file are video and audio files.
* In the case of iOS and OS X (the first platforms in which we were working with Readium), the playback of video and audio files is left to Quicktime.
* Quicktime receives the bytes from the video or audio resource via a small internal web server, the Cocoa HTTP Server (in the case of iOS / OS X).
* So, Quicktime just makes HTTP web requests to the internal Cocoa HTTP Server.
* However, because video and audio files can be quite big, Quicktime makes range requests.
* HTTP range requests are a different kind of request: instead of requesting the entirety of a given resource, they just ask for the bytes in a given range.
* However, FilterChainByteStream is not set up to serve byte range requests.
* The only possible way to do so (and that was something that we tried for some time) was to read the entire resource as bytes, and then select the bytes that would be in the given range.
* But, that was a problem in itself: as we said before, video and audio resources tend to be big. Putting their entire content in memory would take too much memory. That is especially problematic in mobile platforms.
 
###New code path for ContentFilter object (“byte range code path”)

To solve scenarios like reading a video file for Quicktime, we developed the following code path. In order to make it work, though, we had to impose some constraints in order to make the design feasible:

* The most important constraint is that, in the byte range code path, there can be only one ContentFilter that applies. The reason for that is that it would be incredibly complex to try to synchronize a request of a specific byte range among many different ContentFilter objects.
* Secondly, we would try to reuse as much as possible of the previously described architecture so that we would minimize the amount of new code that needed to be written. That was done because the Readium SDK has a short schedule to reach its 1.0 release. After the 1.0 release, further changes in the architecture can be done.

So, based upon the above constraints, we defined the following new code path, which should be used specifically when a byte range request is received (from, for example, Quicktime opening a video file). This code path is derived from the legacy code path described in the previous section, and it will have many steps in common with that. When that happens, that will be indicated in the series of steps below.

1. The first steps are the same: when the Launcher starts, Readium SDK is initialized and a number of ContentFilter classes is registered at the FilterManager.
2. When the Launcher makes a byte range request to a given resource, its code makes a call to Package::GetFilterChainByteStreamRange().
3. The Package object then makes a call to its FilterChain object, calling the method FilterChain::GetFilterChainByteStreamRange().
4. Then, FilterChain follows a similar procedure as it does in the legacy code path. It tries to find out how many ContentFilter objects apply for this given resource.
5. If the number of ContentFilter objects that apply is larger than 1, then it falls back in the legacy code path, which was described previously.
6. However, if only one ContentFilter applies, then it continues with the byte range code path.
7. FilterChain proceeds and instantiates the one ContentFilter that applies.
8. When it comes to its associated FilterContext object, the procedure is a little different. ContentFilter classes that support byte ranges must require a special subclass of FilterContext called RangeFilterContext, which is also abstract.
9. A RangeFilterContext may contain two pieces of information: a reference to the ZipFileByteStream that corresponds to the resource in question, and a reference to a ByteRange object, which is a simple object that just contains the offset and length of the requested range.
10. When the FilterChain instantiates the RangeFilterContext associated with the specific ContentFilter, it also passes to it a reference to the ZipFileByteStream corresponding to the underlying resource, and then it gives the newly instantiated RangeFilterContext to the new ContentFilter object.
11. Then, the FilterChain creates an instance of the FilterChainByteStreamRange class. That class is a subclass of ByteStream and very similar to FilterChainByteStream, with two differences: it supports calls to ReadData() in which a byte range can be passed, and also it can only hold one ContentFilter. The new instance of FilterChainByteStreamRange receives the single ContentFilter that was generated.
12. The instance of FilterChainByteStreamRange is returned to the Launcher.
13. The Launcher, then, calls FilterChainByteStreamRange::ReadData(), passing the range that was requested.
14. At this point, the code diverges again from what the legacy code path does. First, FilterChainByteStreamRange does not read from the ZipFileByteStream that corresponds from the resource.
15. Instead, it first passes the byte range that was requested to the ByteRange object that it is contained in the FilterContext of the single ContentFilter than it holds.
16. Then, it makes a call to ContentFilter::FilterData() to that same ContentFilter.
17. It leaves to the ContentFilter itself the task of reading the bytes that it should operate upon from the resource. That was done because we think that the specific ContentFilter itself will know what it will need to read in order to fulfill a given byte range. For example, a resource encrypted with cypher block may need to read a whole block in order to fulfill a request for a byte.
18. So, in the call to FilterData(), the ContentFilter reads bytes from the requested range, process them, and then returns them to the caller in a buffer of bytes.
19. The Launcher receives the buffer of bytes and uses them.

This is the new code path that was introduced specifically to deal with the media scenarios that we found in iOS/OS X. So far in our testing, it has been going well.

## Second revision to the ContentFilter Architecture (FilterChainByteStream modifications)

###Rationale for the second revision

After we implemented the byte range code path described above, we found another problem:

* The code path described above works great with resources such as media files, in which typically there will be only one ContentFilter that applies.
* However, things get complicate once you have to deal with other kinds of resources, such as XHTML files.
* For those, multiple ContentFilters may apply, such as a Decryption ContentFilter as well as a SwitchPreprocessor ContentFilter and an ObjectPreprocessor ContentFilter.
* Also, files like XHMTL files typically will be small and therefore they should never need specific byte ranges as in media files.
* Therefore, the byte range code path was just not adequate for the files that were not media files.

The FilterChainByteStreamRange class, described in the previous section, has proven that it works well with Decryption ContentFilter objects. However, based on the issues described just above, what we needed was to find a way to make the legacy FilterChainByteStream work with Decryption ContentFilter objects. In the next sub-section, we describe the way that we found to do just that.

### Modifications in the FilterChainByteStream operation

When we were trying to make the legacy FilterChainByteStream class work with Decryption ContentFilter objects, we faced the following problems:

* The first problem was this:
	* In the legacy code path, the only part of the underlying resource that a ContentFilter receives is the buffer of bytes that is passed as input in the ContentFilter::FilterData() method.
	* However, a Decryption ContentFilter may need more parts of the underlying resource. 
		* For example, it may need the Initialization Vector bytes, which are present at the very beginning of the resource. 
		* Or, still, in the case of cypher block encryption, it may need access to the previous cypher block. 
	* Therefore a Decryption ContentFilter will need access to the ZipFileByteStream that corresponds to the resource.
* The second problem was this
	* In fact, a FilterChainByteStream may actually need to read ranges out of a given resource. 
	* Those are not byte ranges as defined in the byte range code path, though. What happens is that the FilterChainByteStream class can read buffers of bytes in a strict sequential fashion. 
	* For example: if the resource has 100 KB in size, the FilterChainByteStream can read the entire resource by reading five 20 KB buffers of bytes, in strictly sequential fashion. 
	* The problem, then, becomes that the Decryption ContentFilter does not know in which part of the resource it is, to know if, for example, is inside a given cypher block or not.

To solve those two problems, we propose the following two modifications in the legacy code path and FilterChainByteStream:

* For the first problem, we tried this:
	* We made a small modification in FilterChainByteStream based on the following:
		* We can make the assumption that all Decryption ContentFilters will support byte ranges. 
		* So, as we described in the previous section, their associated FilterContext class must be a subclass of RangeFilterContext, which can store a reference to a ZipFileByteStream corresponding to the resource.
	* Therefore, we modified FilterChainByteStream so that, when instantiating the FilterContext for a given Decryption ContentFilter, to also save in the RangeFilterContext a reference to the ZipFileByteStream in question.
	* Then, the Decryption ContentFilter can use that ZipFileByteStream to read any parts it may need from the resource.
* For the second problem, we are trying this:
	 * We decided to expand the functionality of the FilterContext class.
	 * Currently, it stores the data needed for a given ContextFilter to perform his operations.
	 * In addition to that, it will also store state about the ContextFilter, in the following way:
	 	* As we stated previously, the FilterChainByteStream can read chunks of bytes out of a given resource, in a sequential fashion.
		* So, the FilterContext object will track which bytes have currently been read, and keep that state.
	* Therefore the ContentFilter will be able to know from which position in the resource a given buffer of bytes in the input comes from, using the state information kept in FilterContext.

