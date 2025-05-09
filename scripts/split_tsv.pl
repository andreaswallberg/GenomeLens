#!/usr/bin/perl -w

# Copyright (c) 2025 Andreas Wallberg (Uppsala University)

# Distributed as a companion CLI script to GenomeLens under the same license.

# The purpose of this Perl script is to split a TSV file by data labels
# provided in any of the columns of the TSV file. The user provides the column
# header for the desired column to split data by. The input TSV can be
# compressed with gzip/bgzip or uncompressed.

# Typical usage:

# perl split_tsv.pl --split CHROM --in myfile.tsv
# or
# ./split_tsv.pl --split CHROM --in myfile.tsv

# This will create new TSV files, one for each label in the CHROM column (i.e.
# one for each chromosome). Other labels can for example be types of SNPs (e.g.
# missense, synonymous etc.).

use strict;
use warnings;
use 5.010;

use Getopt::Long;

my $opt = {

	'in' => [] ,

	'split' => undef ,
	
};

GetOptions(

	$opt ,
	
	# One or more user provided TSV files
	
	'in|tsv=s{,}' ,
	
	# The column header to split data by
	
	'split=s' ,
	
);

unless ( defined $opt->{ 'split' } and $opt->{ 'split' } =~ m/.+/ ) {

	die "Please provide a valid column to split data by using --split";

}

foreach my $tsv_file ( @{ $opt->{ 'in' } } ) {

	my $tsv_in;
	
	if ( $tsv_file =~ m/\.gz$/ ) {

		open ( $tsv_in , "zcat $tsv_file |" ) or die "$!";
	
	}
	
	else {
	
		open ( $tsv_in , "<" , $tsv_file ) or die "$!";
	
	}
	
	my $header_string = <$tsv_in>;
	chomp $header_string;
	
	my @headers = split ( /\t/ , $header_string );
	
	my $header_i;
	
	for ( my $i = 0; $i < @headers; $i++ ) {
	
		my $header = $headers[ $i ];
		
		if ( $header eq $opt->{ 'split' } ) {
		
			$header_i = $i;
			
			last;
		
		}
	
	}
	
	unless ( defined $header_i ) {
	
		die "Please provide a valid column to split data by using --split";
	
	}
	
	my $data_table = {};
	
	while (<$tsv_in>) {

		chomp;
		
		if ( $_ =~ m/^#/ ) {
		
			next;
		
		}
		
		elsif ( $_ =~ m/.+/ ) {
		
			my @data = split ( /\t/ , $_ );
			
			my $label = $data[ $header_i ];
			
			push @{ $data_table->{ $label } } , $_;
			
		}
		
	}
	
	foreach my $label ( sort keys %{ $data_table } ) {
	
		open ( my $out , ">" , "${tsv_file}.split.${label}.tsv" ) or die "$!";
		
		say $out $header_string;
		say $out $_ foreach @{ $data_table->{ $label } };
	
	}

}
