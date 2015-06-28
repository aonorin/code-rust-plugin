VS Code Rust Plugin
===================

This is an attempt to integrate rust racer in VS Code.

I am more of a C++ guy and have not touched javascript since 2005... so sorry for the quality.

I went from the typescript plugin but ended up removing almost everything. 

To use clone in vs.language.rust in Code plugins folder 
(on windows something like C:/Users/UserName/AppData/Local/Code/app-0.3.0/resources/app/plugins/vs.language.rust).

In Code "Preferences->User Settings" add :

	{
		"rust.racerPath": "racer",
		"rust.debug": true
	}
	
If racer is not in your environment PATH, you can set a complete path in "racerPath".
You can use "debug" to output logs in the console.

I have trouble making the racer autocomplete work with the rust pre-defined syntax... pull requests are welcome !

As racer takes a file path, you need to save before ctrl+spacing.