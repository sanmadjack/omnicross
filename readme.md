# Omnicross
A collected-edition comic book overlap checker.

## Summary
There are many collected editions of comic books out there, and making sure you don't collect the same content multiple times can be challenging. This tool checks two or more selected compilations and lets you know what content is overlapping and what content is unique and to what collection.

## Usage

Go to https://omnicross.isnotan.app/

## Contributing

Contributing should be done by creating issues or pull requests.

All contributions are likely welcome, but for building out the usefullness of the tools these kind of feedback are particularly useful:

* Series name correction - In order to match up issues, the names of the series specified on a compilation needs to be consistent with all other compilations. If you notice any discrepencies in the series names, create an issue or a pull request to correct it.
* More compilation data -  To get the information you need added, you can create an issue containing one of these: 
  * A picture of a book that shows its contents.
  * A link to information about a book and its contents.
  * Manually add your book data to the data.json file (see Data Format section below).


### Data Format
Data on each compilation is stored in the data.json file. The file contains JSON data for an array of objects, eaech object describing a compilation. The object format is as follows:
````
{
	"id": "019d013c-1ba8-763e-99ce-3f33a90fe642",
	"title": "The Sensational She-Hulk Omnibus",
	"format": "omnibus",
"reference": "https://marvel.fandom.com/wiki/Sensational_She-Hulk_by_John_Byrne_Omnibus_Vol_1_1",
	"issues": {
		"Marvel Graphic Novel (1982)": "18",
		"Sensational She-Hulk (1989)": "1-8,31-46,48-50"
	},
	"partials": {
		"Marvel Comics Presents (1988)": "18"
	}
}
````
| Field     | Description                                                                                                                                                                                                                                                                                                                                                   | Allowed values              |
| -----------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| -----------------------------|
| id        | A unique randomly generated UUID. This is set statically so as to allow users to save lists of compilations without losing htem when there's an update.                                                                                                                                                                                                       |                             |
| title     | The title of the compilation                                                                                                                                                                                                                                                                                                                                  |                             |
| format    | The type of compilation. To be used in future filtering.                                                                                                                                                                                                                                                                                                      | omnibus, tpb, ohc, absolute |
| reference | A URL source for information about the compilation.                                                                                                                                                                                                                                                                                                           |                             |
| issues    | The issues contained in the compilation. Sepecified as a JSON object, with the fields specifying the names of the series the issues are for, and the value specifying the issue ranges. Issue ranges are a comma-seperated list of number ranges or whole numbers. Issues with fraction numbers cannot be in a range and must be specified on their own, i.e "1-2,0.5". Series names must be consistent between all compilations, or the overlap check won't work. |                             |
| partials  | Issues that are contained in part in the compilation. Usually described as "material from". This isn't currently used in the overlap calculations, but I'm gathering it anyway so that it can eventually be made usfeul. Uses the same format as the issues field.                                                                                            |                             |