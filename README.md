VS Code Rust Plugin
===================

This is an attempt to integrate rust racer in VS Code.

I am more of a C++ guy and have not touched javascript since 2005... so sorry for the quality.

I went from the typescript plugin but ended up removing almost everything. 

To use clone in vs.language.rust in Code plugins folder 
(on windows something like C:/Users/UserName/AppData/Local/Code/app-0.3.0/resources/app/plugins/vs.language.rust).

As racer takes a file path, a temporary file needs to be created by the plugin.
Sorry about that to cleanup just do a "rm *.rs.tmp".

Usage
-----

You can use ctrl+space to trigger auto-completion. Then use the up/down arrow to navigate.
If a function definition is preceded by rustdoc comments, the doc should show in the popup.

You can use ctrl+click to see the definition of the object.

Parameter hints should popup when inside a function call.

Configuration
-------------

If racer is not in your environment PATH, you can set a complete path in "racerPath".
You can use "debug" to output logs in the console.
To do this, in "Preferences->User Settings" add :

	{
		"rust.racerPath": "/path/to/racer",
		"rust.debug": true
	}
	