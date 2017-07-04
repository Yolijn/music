# MusicBrainz - Development / XML Web Service / Version 2

- The web service root URL is https://musicbrainz.org/ws/2/.

## We have 12 resources on our web service which represent core entities in our database:

- area
- artist
- event
- instrument
- label
- place
- recording
- release
- release-group
- series
- work
- url

On each entity resource, you can perform three different GET requests:

- lookup:   /<ENTITY>/<MBID>?inc=<INC>
- browse:   /<ENTITY>?<ENTITY>=<MBID>&limit=<LIMIT>&offset=<OFFSET>&inc=<INC>
- search:   /<ENTITY>?query=<QUERY>&limit=<LIMIT>&offset=<OFFSET>
... except that search is not implemented for URL entities at this time.

## Lookups
You can perform a lookup of an entity when you have the MBID for that entity:

- lookup:   /<ENTITY>/<MBID>?inc=<INC>
Note that unless you have provided an MBID in exactly the format listed, you are not performing a lookup request. If your URL includes something like artist=<MBID>, then please see the Browse section.

## Browse
Browse requests are a direct lookup of all the entities directly linked to another entity. (with directly linked I am referring to any relationship inherent in the database, so no ARs). For example, you may want to see all releases on netlabel ubiktune: /ws/2/release?label=47e718e1-7ee4-460c-b1cc-1192a841c6e5

Note that browse requests are not searches, in order to browse all the releases on the ubiktune label you will need to know the MBID of ubiktune.

Browsed entities are always ordered alphabetically by gid. If you need to sort the entities, you will have to fetch all entities (see "Paging" below) and sort them yourself.



